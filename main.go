package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
)

var DefaultCapacity = 1000

type Id string

type HandshakeApiMessage struct {
	Id       string `json:"id"`
	MesgType string `json:"mesgType"`
	Data     string `json:"data"`
}

type MessageType int

const (
	UpdateOffer   MessageType = 0
	UpdateAnswer  MessageType = 1
	GetOffer      MessageType = 2
	SendCandidate MessageType = 3
)

type Message struct {
	mesgType MessageType
	data     string
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
	answers     map[Id]string
	offerConns  map[Id]*websocket.Conn
	answerConns map[Id]*websocket.Conn
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
	delete(handler.answers, id)
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
	}

	if senderOk {
		logger.Printf("%s/%d: Echoing back response to sender", id, scope)
		sender.WriteJSON(message)
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

// func (handler *ConnectionHandler) UpdateAnswer(id Id, scope ScopeType, message Message) {
// 	logger.Printf("%s/%d: UpdateAnswer: %s", id, scope, message.data)
// 	handler.mutex.Lock()
// 	handler.answers[id] = message.data
// 	handler.mutex.Unlock()

// 	offerConn, ok := handler.offerConns[id]
// 	if ok {
// 		logger.Printf("%s/%d: UpdateAnswer - Sending answer to offer side", id, scope)
// 		offerConn.WriteMessage(websocket.TextMessage, []byte(message.data))
// 	}

// 	answerConn, ok := handler.answerConns[id]
// 	if ok {
// 		logger.Printf("%s/%d: UpdateAnswer - Sending confirmation to answer side", id, scope)
// 		answerConn.WriteMessage(websocket.TextMessage, []byte(message.data))
// 	}
// }

// func (handler *ConnectionHandler) GetOffer(id Id, scope ScopeType, message Message) {
// 	logger.Printf("%s/%d: GetOffer", id, scope)
// 	offer, ok := handler.offers[id]
// 	conn, connOk := handler.answerConns[id]

// 	if ok && connOk {
// 		logger.Printf("%s/%d: GetOffer - Sending offer: %s", id, scope, offer)
// 		conn.WriteMessage(websocket.TextMessage, []byte(offer))
// 	}
// }

// func (handler *ConnectionHandler) SendCandidate(id Id, scope ScopeType, message Message) {
// 	logger.Printf("%s/%d: SendCandidate", id, scope)

// 	var conn *websocket.Conn
// 	var present bool

// 	switch scope {
// 	case OfferScope:
// 		conn, present = handler.answerConns[id]

// 	case AnswerScope:
// 		conn, present = handler.offerConns[id]
// 	}

// 	if present {
// 		logger.Printf("%s/%d: Sending candidate to other side: %s", id, scope, message.data)
// 		conn.WriteMessage(websocket.TextMessage, []byte(message.data))
// 	}
// }

// func (handler *ConnectionHandler) HandleMessage(id Id, scope ScopeType, message Message) error {
// 	switch message.mesgType {
// 	case UpdateOffer:
// 		handler.UpdateOffer(id, scope, message)

// 	case UpdateAnswer:
// 		handler.UpdateAnswer(id, scope, message)

// 	case GetOffer:
// 		handler.GetOffer(id, scope, message)

// 	case SendCandidate:
// 		handler.SendCandidate(id, scope, message)
// 	}

// 	return nil
// }

var logger = log.New(os.Stdout, "", log.LstdFlags)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(req *http.Request) bool {
		logger.Printf("Upgrader: Origin: %v", req.Header["Origin"])

		return true
	},
}

var connHandler = ConnectionHandler{
	offers:      make(map[Id][]byte, DefaultCapacity),
	answers:     make(map[Id]string, DefaultCapacity),
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

func main() {
	addr := flag.String("addr", "localhost:9090", "Server port to listen on")
	flag.Parse()

	logger.Printf("Listening on address: %s", *addr)
	http.HandleFunc("/ws", handshake)

	logger.Fatal(http.ListenAndServe(*addr, nil))
}
