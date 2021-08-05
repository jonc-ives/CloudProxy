# server.py

# con-alarm -- JT Ives
# flask (+RESTful) server endpoints for web-app controls

from flask import Flask, jsonify, render_template, request, make_response, send_file
from flask_restful import Resource, Api, request
from flask_cors import CORS, cross_origin
from io import BytesIO
from PIL import Image
import os, requests, json, feedparser, re
import xmltodict

REMOTE = False

app = Flask(__name__, template_folder=os.path.dirname(os.path.abspath("application.py")) + "/static")
api = Api(app)

serverURL = ""
containerURL = ""
contentURL = ""
contentCount = 0
thumbnails = {}

local = '192.168.0.3'
remote = '75.118.37.73' if REMOTE else '192.168.0.3'

class INDEX(Resource):

    def get(self):
        resp = make_response(render_template('index.html'))
        resp.headers['Content-Type'] = 'html'
        return resp

class TMPALL(Resource):

    def get(self):
        global serverURL
        global containerURL
        global contentURL
        global contentCount
        
        if not serverURL:
            try:
                serverURLReq = requests.get('http://192.168.0.3:9000/nmc/rss/server?start=0&fmt=json'.replace(local, remote))
                if serverURLReq.status_code != 200:
                    return jsonify({"error": serverURLReq.status_code, 'msg': 'Failed proxy request'})
                serverURLContent = json.loads(serverURLReq.text)
                serverURL = serverURLContent['item'][0]['enclosure']['url'].replace(local, remote)
            except KeyError:
                return jsonify({'error': 500, 'msg': 'ServerURL extraction - KeyError'})
            except:
                return jsonify({'error': 500, 'msg': 'ServerURL extraction - Proxy Error'})
        
        if not containerURL:
            try:
                containerURLReq = requests.get(serverURL + '?start=0&fmt=json')
                if containerURLReq.status_code != 200:
                    return jsonify({"error": containerURLReq.status_code, 'msg': 'Failed proxy request'})
                containerURLContent = json.loads(containerURLReq.text)
                containerURL = containerURLContent['item'][2]['enclosure']['url'].replace(local, remote)
            except KeyError:
                return jsonify({'error': 500, 'msg': 'ContainerURL extraction - KeyError'})
            except:
                return jsonify({'error': 500, 'msg': 'ContainerURL extraction - Proxy Error'})

        if not contentURL:
            try:
                contentURLReq = requests.get(containerURL + '?start=0&fmt=json')
                if contentURLReq.status_code != 200:
                    return jsonify({"error": contentURLReq.status_code, 'msg': 'Failed proxy request'})
                contentURLContent = json.loads(contentURLReq.text)
                contentURL = contentURLContent['item'][1]['enclosure']['url'].replace(local, remote)
                contentCount = contentURLContent['item'][1]['meta']['childCount']
            except KeyError:
                return jsonify({'error': 500, 'msg': 'ServerURL extraction - KeyError'})
            except:
                return jsonify({'error': 500, 'msg': 'ServerURL extraction - Proxy Error'})

        return jsonify({'msg': 'Successfully connected to content server'})

class CONTENT(Resource):

    def get(self):
        global contentURL
        global contentCount
        global thumbnails

        if not contentURL:
            return jsonify({'redirect': '/tmp-all'})

        query = request.args
        if not query.get('start') or not query.get('count'):
            return jsonify({'error': 400, 'msg': "Missing content meta parameter(s) 'start' or 'count' in query string"})
        if not query.get('start').isnumeric() or not query.get('count').isnumeric():
            return jsonify({'error': 400, 'msg': "Invalid content meta parameter(s) 'start' or 'count' in query string"})

        try:
            metaReq = requests.get(contentURL + 'start=' + query.get('start') + '&count=' + query.get("count") + '&fmt=json')
            if metaReq.status_code != 200:
                return jsonify({"error": metaReq.status_code, 'msg': 'Failed proxy request'})
            
            # parse xml to dictStrObj to JSON string to dict 
            metaContent = json.loads(json.dumps(xmltodict.parse(metaReq.text)))
            
            # extract required information for each object
            returnedMeta = {'item': [], 'collectionCount': contentCount}
            for item in metaContent['rss']['channel']['item']:
                returnedMeta['item'].append(
                    {
                        'title': item['title'],
                        'date': item['meta'].get('dc:date'),
                        'duration': item['meta'].get('pv:duration'),
                        'size': item['meta']['res'][0].get('@size'),
                        'bitrate': item['meta']['res'][0].get('@bitrate'),
                        'resolution': item['meta']['res'][0].get('@resolution'),
                        'link': item['meta']['res'][0]['#text'].replace('http://192.168.0.3:9000', ''),
                        'thumbnail': item['meta']['res'][-1]['#text'].replace('http://192.168.0.3:9000', '')
                    }
                )

            # return simplified meta content
            return jsonify(returnedMeta)
        except:
            return jsonify({'error': 500, 'msg': 'Content extraction - Proxy Error'})

class THUMBNAILS(Resource):

    def get(self):
        global contentURL
        global contentCount
        global remote

        if not contentURL:
            return 404

        query = request.args
        if not query.get('uri'):
            return 404
        
        try:
            req = requests.get('http://' + remote + ':9000' + query.get('uri'), stream=False)
            if req.status_code != 200:
                return 404
            return send_file(
                BytesIO(req.content),
                attachment_filename='thumbnail.jpeg',
                mimetype='image/jpg'
            )
        except:
            return 500


api.add_resource(INDEX, '/')
api.add_resource(TMPALL, '/tmp-all')
api.add_resource(CONTENT, '/meta')
api.add_resource(THUMBNAILS, '/thumbnail')
app.run(host='0.0.0.0', port="3001")