package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var DefaultCapacity = 1000

type Id string

type HandshakeApiMessage struct {
	Id       string `json:"id"`
	MesgType string `json:"mesgType"`
	Data     string `json:"data"`
}

type HandshakeApiMessageConfirm struct {
	Id string `json:"id"`
}

type ICEConfig struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func parseMessage(msgStr string) (msg HandshakeApiMessage, err error) {
	err = json.Unmarshal([]byte(msgStr), &msg)

	return msg, err
}

type ScopeType int

const (
	OfferScope  ScopeType = 0
	AnswerScope ScopeType = 1
)

type ConnectionHandler struct {
	mutex       sync.RWMutex
	offers      map[Id][]byte
	candidates  map[Id][]HandshakeApiMessage
	offerConns  map[Id]*websocket.Conn
	answerConns map[Id]*websocket.Conn
	twilioSID   string
	twilioToken string
	iceConfig   ICEConfig
}

func (handler *ConnectionHandler) HandleConnection(scope ScopeType, id Id, conn *websocket.Conn) error {
	handler.InitConnection(scope, id, conn)
	defer handler.CloseConnection(scope, id, conn)

	for {
		_, bytes, err := conn.ReadMessage()
		if err != nil {
			logger.Printf("%s/%d: Error on websocket read: %v", id, scope, err)
			break
		}

		logger.Printf("%s/%d: Receive raw message: %s", id, scope, bytes)

		message, err := parseMessage(string(bytes))
		if err != nil {
			logger.Printf("%s/%d: Error parsing message: %v", id, scope, err)
		}

		err = handler.HandleMessage(id, scope, message)
		if err != nil {
			logger.Printf("%s/%d: Error handling message: %v", id, scope, err)
		}
	}

	return nil
}

func (handler *ConnectionHandler) InitConnection(scope ScopeType, id Id, conn *websocket.Conn) {
	handler.mutex.Lock()
	defer handler.mutex.Unlock()

	switch scope {
	case OfferScope:
		handler.offerConns[id] = conn

	case AnswerScope:
		handler.answerConns[id] = conn
		storedCandidates, ok := handler.candidates[id]
		if ok {
			logger.Printf("%s/%d: %d Stored candidates present, sending to partner", id, scope, len(storedCandidates))

			for k := 0; k < len(storedCandidates); k++ {
				logger.Printf("Sending candidate %d - %v", k, storedCandidates[k])
				conn.WriteJSON(storedCandidates[k])
			}
			logger.Printf("Deleting")
			delete(handler.candidates, id)
		}
	}

	logger.Printf("%s/%d: Added connection to scope", id, scope)
}

func closeConnection(id Id, conns map[Id]*websocket.Conn) {
	conn, ok := conns[id]
	if ok {
		conn.Close()
	}
}

func (handler *ConnectionHandler) CloseConnection(scope ScopeType, id Id, conn *websocket.Conn) error {
	handler.mutex.Lock()
	defer handler.mutex.Unlock()

	logger.Printf("%s/%d: Closing connections", id, scope)
	closeConnection(id, handler.offerConns)
	closeConnection(id, handler.answerConns)

	logger.Printf("%s/%d: Deleting keys", id, scope)
	delete(handler.offers, id)
	delete(handler.candidates, id)
	delete(handler.offerConns, id)
	delete(handler.answerConns, id)

	logger.Printf("%s/%d: Cleaned up data", id, scope)

	return conn.Close()
}

func (handler *ConnectionHandler) GetConns(id Id, scope ScopeType) (sender *websocket.Conn, senderOk bool, partner *websocket.Conn, partnerOk bool, err error) {
	switch scope {
	case OfferScope:
		sender, senderOk = handler.offerConns[id]
		partner, partnerOk = handler.answerConns[id]

	case AnswerScope:
		sender, senderOk = handler.answerConns[id]
		partner, partnerOk = handler.offerConns[id]
	}

	if !senderOk {
		err = fmt.Errorf("%s/%d: Sender not found, but should have", id, scope)
	}

	return sender, senderOk, partner, partnerOk, err
}

func (handler *ConnectionHandler) HandleMessage(id Id, scope ScopeType, message HandshakeApiMessage) error {
	sender, senderOk, partner, partnerOk, err := handler.GetConns(id, scope)
	if err != nil {
		return err
	}

	switch message.MesgType {
	case "offer":
		handler.Offer(id, scope, message)

	case "answer":
		handler.Answer(id, scope, partner, partnerOk, message)

	case "get-offer":
		handler.GetOffer(id, scope, sender, senderOk)

	case "candidate":
		handler.Candidate(id, scope, partner, partnerOk, message)
	}

	if senderOk {
		logger.Printf("%s/%d: Echoing back response to sender (mesgId: %s)", id, scope, message.Id)
		sender.WriteJSON(HandshakeApiMessageConfirm{message.Id})
	}

	return nil
}

func (handler *ConnectionHandler) Offer(id Id, scope ScopeType, message HandshakeApiMessage) {
	logger.Printf("%s/%d: Offer: %v", id, scope, message)

	jsonBytes, _ := json.Marshal(message)
	handler.mutex.Lock()
	handler.offers[id] = jsonBytes
	handler.mutex.Unlock()
}

func (handler *ConnectionHandler) Answer(id Id, scope ScopeType, partner *websocket.Conn, partnerOk bool, message HandshakeApiMessage) {
	if !partnerOk {
		logger.Printf("%s/%d: Answer - partner not found (unexpected)", id, scope)
		return
	}

	logger.Printf("%s/%d: Answer - sending back response %+v", id, scope, message)
	partner.WriteJSON(message)
}

func (handler *ConnectionHandler) GetOffer(id Id, scope ScopeType, requester *websocket.Conn, requesterOk bool) {
	offerBytes, offerOk := handler.offers[id]
	if !offerOk {
		logger.Printf("%s/%d: GetOffer: offer not present", id, scope)
		return
	}

	if !requesterOk {
		logger.Printf("%s/%d: GetOffer: requester not present, unexpected", id, scope)
		return
	}

	var offer HandshakeApiMessage
	err := json.Unmarshal(offerBytes, &offer)
	if err != nil {
		logger.Printf("%s/%d: GetOffer: Error in unmarshaling json %v", id, scope, err)
		return
	}

	logger.Printf("%s/%d: GetOffer Sending offer to requester", id, scope)
	requester.WriteJSON(offer)
}

func (handler *ConnectionHandler) Candidate(id Id, scope ScopeType, partner *websocket.Conn, partnerOk bool, message HandshakeApiMessage) {
	if !partnerOk {
		logger.Printf("%s/%d: Candidate - partner connection not found, storing for later transmittal", id, scope)

		handler.mutex.Lock()
		defer handler.mutex.Unlock()

		candidates := handler.candidates[id]
		candidates = append(candidates, message)
		handler.candidates[id] = candidates

		return
	}

	logger.Printf("%s/%d: Candidate - sending candidate to partner %v", id, scope, message)
	partner.WriteJSON(message)
}

func (handler *ConnectionHandler) RefreshICE(sid string, token string) {
	handler.mutex.Lock()
	handler.twilioSID = sid
	handler.twilioToken = token
	handler.mutex.Unlock()

	fetchIceConfig := func() {
		url := fmt.Sprintf("https://%s:%s@api.twilio.com/2010-04-01/Accounts/%s/Tokens.json", sid, token, sid)

		for {
			resp, err := http.Post(url, "application/json", strings.NewReader(""))
			if err != nil {
				logger.Printf("RefreshIce: Error when fetching Twilio config %v", err)
			} else {
				body, _ := ioutil.ReadAll(resp.Body)
				resp.Body.Close()

				iceConfig := ICEConfig{}
				json.Unmarshal(body, &iceConfig)
				logger.Printf("RefrechIce: Unmarshaled Twilio Response: %v", iceConfig)

				handler.mutex.Lock()
				handler.iceConfig = iceConfig
				handler.mutex.Unlock()
			}

			logger.Printf("RefreshIce: credentials updated, sleeping for an hour")
			time.Sleep(time.Hour)
		}
	}

	go fetchIceConfig()
}

var logger = log.New(os.Stdout, "", log.LstdFlags)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(req *http.Request) bool {
		logger.Printf("Upgrader: Origin: %v", req.Header["Origin"])

		return true
	},
}

var connHandler = ConnectionHandler{
	offers:      make(map[Id][]byte, DefaultCapacity),
	candidates:  make(map[Id][]HandshakeApiMessage, DefaultCapacity),
	offerConns:  make(map[Id]*websocket.Conn, DefaultCapacity),
	answerConns: make(map[Id]*websocket.Conn, DefaultCapacity),
}

func handshake(writer http.ResponseWriter, reader *http.Request) {
	conn, err := upgrader.Upgrade(writer, reader, nil)
	if err != nil {
		logger.Printf("handshake: Failed to upgrade connection: %v", err)
		return
	}

	id := Id(reader.FormValue("id"))
	scope, err := strconv.Atoi(reader.FormValue("scope"))

	if err == nil {
		err = connHandler.HandleConnection(ScopeType(scope), id, conn)
		if err != nil {
			logger.Printf("%s/%d: Error while handling connection: %v", id, scope, err)
		}
	}
}

func root(writer http.ResponseWriter, reader *http.Request) {
	http.ServeFile(writer, reader, string(http.Dir("public/index.html")))
}

type ConfigHandler struct{}

var configTemplate, _ = template.New("Config").Parse("var USERNAME = \"{{.Username}}\";\nvar PASSWORD = \"{{.Password}}\";")

func (config ConfigHandler) ServeHTTP(writer http.ResponseWriter, reader *http.Request) {
	configTemplate.Execute(writer, connHandler.iceConfig)
}

func getEnv() (addr string, twilioSID string, twilioToken string) {
	port := os.Getenv("PORT")
	addr = fmt.Sprintf(":%s", port)

	twilioSID = os.Getenv("TWILIO_SID")
	twilioToken = os.Getenv("TWILIO_TOKEN")

	return addr, twilioSID, twilioToken
}

func main() {
	address, twilioSID, twilioToken := getEnv()
	logger.Printf("Listening on address: %s", address)

	connHandler.RefreshICE(twilioSID, twilioToken)

	http.HandleFunc("/ws", handshake)
	http.Handle("/config.js", ConfigHandler{})

	static := http.FileServer(http.Dir("public"))
	http.Handle("/", static)
	http.HandleFunc("/recv/", root)

	logger.Fatal(http.ListenAndServe(address, nil))
}
