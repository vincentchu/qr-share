package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}
var logger = log.New(os.Stdout, "", log.LstdFlags)

func handshake(writer http.ResponseWriter, reader *http.Request) {
	conn, err := upgrader.Upgrade(writer, reader, nil)
	if err != nil {
		logger.Printf("Failed to upgrade connection: %v\n", err)
		return
	}
	defer conn.Close()

	for {
		mesgType, bytes, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error on websocket read: %v\n", err)
			break
		}

		log.Printf("Receive (%5d):  %s\n", mesgType, bytes)
	}
}

func main() {
	addr := flag.String("addr", "localhost:9090", "Server port to listen on")
	flag.Parse()

	logger.Printf("Listening on address: %s\n", *addr)

	http.HandleFunc("/handshake", handshake)
	logger.Fatal(http.ListenAndServe(*addr, nil))
}
