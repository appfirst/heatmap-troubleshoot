import SimpleHTTPServer
import SocketServer
import urllib2
import json
import string
from urlparse import urlparse, parse_qs
import threading

class MyRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

	# def handle(self):
		# data = self.request.recv(1024)
		
    def do_GET(self):
		if self.path != "/favicon.ico":
			theurl = "https://wwws.appfirst.com" + self.path
			parsedquery = parse_qs(urlparse(theurl).query)
			# print urlparse(theurl).query
			# theurl = string.replace(theurl, "?" + urlparse(theurl).query, "")
			# print theurl
			username = "*****"
			password = "*****"

			passman = urllib2.HTTPPasswordMgrWithDefaultRealm()
			passman.add_password(None, theurl, username, password)

			authhandler = urllib2.HTTPBasicAuthHandler(passman)

			opener = urllib2.build_opener(authhandler)

			urllib2.install_opener(opener)

			pagehandle = urllib2.urlopen(theurl)
			data = json.load(pagehandle)
			self.send_response(200)
			self.send_header('Access-Control-Allow-Origin', '*')
			self.send_header('Content-type', 'text/javascript')
			self.end_headers()
			self.request.sendall(json.dumps(data))

class ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
	pass
			
Handler = MyRequestHandler
server = ThreadedTCPServer(('localhost', 9000), Handler)
print "Starting server."
try:
	server.serve_forever()
except Exception, err:
	print err
	pass
print "Shutting down server."