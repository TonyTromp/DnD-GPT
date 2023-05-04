import json, os, random
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
import openai
from openai.error import RateLimitError
from glob import glob
import pathlib, mimetypes; 
import json
import logging

app = Flask(__name__)
logger = logging.getLogger("__name__")
logging.basicConfig(level=logging.INFO)

openai.api_key = os.getenv("OPENAI_API_KEY")
openai.organization = os.getenv("OPENAI_ORGANIZATION")
gpt_model="gpt-4"
gpt_model="gpt-3.5-turbo-0301"
#gpt_model="gpt-3.5-turbo"
mimetypes.init();

app = Flask(__name__)
with app.app_context():
    f=open('./gameconfig.json')
    config=json.load(f)
    f.close()

    app.config['DM_PERSONAS'] = config['Default_DungeonMaster']
    app.config['HERO_PERSONAS'] = config['Default_Party']
    app.config['PROMPT_CREATE_PARTY'] = config['Prompts']['GenerateParty']
    app.config['PROMPT_CREATE_DM'] = config['Prompts']['GenerateDM']
    app.config['PROMPT_SUBMIT_DM'] = config['Prompts']['CreateDM']


# /:default
@app.route('/')
def index():
    return render_template('index.html', model=gpt_model)

# /img:files
@app.route('/resources/<path:path>')
def path_img(path):
    return send_from_directory('resources', path)

# /random_image http://127.0.0.1:8000/random_image/background/start/
@app.route('/random_image/<path:path>')
def random_image(path):
    file_path='./resources/img/'+path;
    if (os.path.exists(file_path)):
      choosen_file=random.choice( glob(file_path +'/*.jpeg') );
      mime_type=mimetypes.types_map[pathlib.Path(choosen_file).suffix];
  
      return send_file(choosen_file, mimetype=mime_type)
    return 503    

# We store our history
messages = []

# This appends any message to the messages. without any submission to ChatGPT.
# It allows earlier responses to be re-injected/changed before starting a chat conversation
@app.route('/append_message', methods=['GET', 'POST'])
def append_message():
    user_input = request.args.get('user_input') if request.method == 'GET' else request.form['user_input']
    system_input = request.args.get('system_input') if request.method == 'GET' else request.form['system_input']

    if user_input:
        messages.append({"role": "user", "content": user_input})
    if system_input:
        messages.append({"role": "system", "content": system_input})
    return 'OK';


@app.route('/gpt', methods=['GET', 'POST'])
def gpt():
    user_input = request.args.get('user_input') if request.method == 'GET' else request.form['user_input']
    system_input = request.args.get('system_input') if request.method == 'GET' else request.form['system_input']

    if user_input:
        messages.append({"role": "user", "content": user_input})
    if system_input:
        messages.append({"role": "system", "content": system_input})

    try:
        response = openai.ChatCompletion.create(
            model= gpt_model,
            messages=messages
        )
        content = response.choices[0].message["content"]
        messages.append({"role": "assistant", "content": content})
    except RateLimitError:
        content = "The server is experiencing a high volume of requests. Please try again later."

    return jsonify(content=content)

@app.route('/personas', methods=['GET', 'POST'])
def get_personas():
    return jsonify(app.config['DM_PERSONAS']);

# Get Random Persona from Server..Note this does not set the persona
# To set the persona. you need to push the message also to messages list
@app.route('/generate_dm_persona', methods=['GET', 'POST'])
def generate_dm_persona():
    query = app.config['PROMPT_CREATE_DM'];
    message=[{"role": "system", "content": query}]
    logging.info("Generate_DM_Persona")
    logging.info("- "+ str(message))
    logging.info("- Note: This system message is not stored, allowing clients to update the persona if required")

    try:
        response = openai.ChatCompletion.create(
            model=gpt_model,
            messages=message
        )
        content = response.choices[0].message["content"]
    except RateLimitError:
        content = "The server is experiencing a high volume of requests. Please try again later."

    logging.info("- "+ str(content))

    try: 
        json_content = json.loads(content)
    except json.JSONDecodeError:
        json_content = json.loads( {"result": "JSONDecodeError.. ChatGPT did not return in JSON Format"} )
    # We will also return the original request/message, so we can store persistant after client has made any modifications.
    # {"result": json_content, "request": message}

    json_content = {"response": json_content, "request": message[0]}
    
    return jsonify(json_content);


@app.route('/submit_dm_persona', methods=['POST'])
def submitDMPersona():
  logging.info( str("[+] [{method}] /submit_dm_persona").format(method=request.method) )
  persona = request.get_json()

  prompt=app.config['PROMPT_SUBMIT_DM']
  prompt=prompt.replace('{{name}}', persona['name'])
  prompt=prompt.replace('{{race}}', persona['race'])
  prompt=prompt.replace('{{class}}', persona['class'])
  prompt=prompt.replace('{{story}}', persona['character'])

  logging.info('- '+prompt)
  message=[{"role": "system", "content": prompt}]
  try:
    response = openai.ChatCompletion.create(
        model=gpt_model,
        messages=message
    )
    content = response.choices[0].message["content"]
  except RateLimitError:
    content = "The server is experiencing a high volume of requests. Please try again later."

  logging.info("- "+ str(content))
  return jsonify(result=content)


@app.route('/default_party', methods=['GET', 'POST'])
def default_party():
    party_size = request.args.get('party_size') if request.method == 'GET' else request.form['party_size']
    logging.info( str("[+] [{method}] /default_party::{party_size}").format(method=request.method, party_size=party_size) )
    if (party_size):
        try:
            party_size = int(party_size)
        except ValueError as ve:
            logger.warning("[-] default_party::party_size Exception. Set Party Size to default=4.")
            party_size=4
    else:
        party_size=4

    return jsonify(app.config['HERO_PERSONAS'][0:party_size])


# Create random party based on size
@app.route('/random_party', methods=['GET', 'POST'])
def generate_random_party():
    logging.info( str("[+] [{method}] /random_party").format(method=request.method) )
    party_size = request.args.get('party_size') if request.method == 'GET' else request.form['party_size']
    if (party_size is None):
        party_size='4'
    return jsonify(__generate_random_party(party_size))

def __generate_random_party(party_size):
    if (int(party_size)>=8):
        party_size=8

    prompt=app.config['PROMPT_CREATE_PARTY'].replace('{{size}}', str(party_size))
    messages.append({"role": "user", "content": prompt})

    try:
        response = openai.ChatCompletion.create(
            model=gpt_model,
            messages=messages
        )
        content = response.choices[0].message["content"]
        messages.append({"role": "assistant", "content": content})
    except RateLimitError:
        content = "The server is experiencing a high volume of requests. Please try again later."
    try: 
        json_content = json.loads(content)
    except json.JSONDecodeError:
        json_content = json.loads( {"result": "JSONDecodeError.. ChatGPT did not return in JSON Format"} )
    
    logging.info(json_content)
    for hero in json_content:
        hero['image_url']=__get_avatar(hero['race'], hero['class'], hero['gender'][0].lower())
        logging.info(hero)
    return json_content



# get avatar-url
@app.route('/get_avatar_url', methods=['GET', 'POST'])
def get_avatar():
    logging.info( str("[+] [{method}] /get_avatar_url").format(method=request.method) )

    race   = request.args.get('race') if request.method == 'GET' else request.form['race']
    hclass = request.args.get('class') if request.method == 'GET' else request.form['class']
    gender = request.args.get('gender') if request.method == 'GET' else request.form['gender']

    # default race
    if not race:
        race = 'human'
    else:
        race = race.lower()
        if not race in ('dwarf', 'elf', 'human', 'orc'):
            race = 'warrior'
    if not hclass:
        hclass = '*'
    else:
        hclass = hclass.lower()
        if not hclass in ('thief', 'warrior', 'wizard'):
            hclass = 'warrior'
    if not gender:
        gender = '*'
    else:
        gender = gender[0].lower()
    
    return jsonify({"result": {"url":  __get_avatar(race, hclass, gender) } });
    

def __get_avatar(race, hclass, gender):
    logging.info( str("[+] __get_avatar({race},{hclass},{gender})").format(method=request.method, race=race,hclass=hclass, gender=gender) )

    fpattern = "./resources/img/avatar/{race}/small_{race}_{hclass}_{gender}*.png".format(race=race.lower(), hclass=hclass.lower(), gender=gender.lower())
    logging.info("- "+ str(fpattern))

    try:
      choosen_file=random.choice( glob(fpattern) );
    except IndexError as error:
      return ''

    return choosen_file

if __name__ == '__main__':
    logger.info('D&D-GPT Started...')
    messages.append({"role": "system", "content": "You are a Dungeon Master in our D&D game."})
    messages.append({"role": "system", "content": "Valid races are: Human, Elf, Orc, Dwarf"})
    messages.append({"role": "system", "content": "Valid classes are: Warrior, Wizard, Thief"})

    app.run(host='0.0.0.0', port=8000, debug=True)