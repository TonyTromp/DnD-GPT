class DnGPT {

  DungeonMaster;
  /* Default Party */
  onPartyChanged = new CustomEvent("onPartyChanged", {
    detail: {},
    bubbles: true,
    cancelable: true,
    composed: false,
  });
  EventTarget = new EventTarget();

  Party = [
    {
      "image_url": "/resources/img/avatar/elf/small_elf_warrior_f01.png",
      "name": "Elara Windwhisper",
      "age": 128,
      "gender": "Female",
      "race": "Elf",
      "class": "Ranger",
      "character": "Elara Windwhisper is a master of the bow, trained in the ancient elven ways of archery. She roams the forests and mountains, defending her homeland from all who would threaten it. She is quiet and reserved, but her aim is deadly and her loyalty unwavering."
    },
    {
      "image_url": "/resources/img/avatar/orc/small_orc_warrior_m10.png",
      "name": "Grommash Hellscream",
      "age": 40,
      "gender": "Male",
      "race": "Orc",
      "class": "Warrior",
      "character": "Grommash is a fierce and powerful warrior, feared by many for his incredible strength and fighting prowess. Despite his fearsome reputation, he has a strong sense of honor and loyalty to his allies."
    },
    {
      "image_url": "/resources/img/avatar/elf/small_elf_wizard_f01.png",
      "name": "Lirienia Nightshade",
      "age": 240,
      "gender": "Female",
      "race": "Elf",
      "class": "Wizard",
      "character": "Lirienia is a powerful wizard, known for her incredible mastery of the arcane arts. She is often lost in her own thoughts and can be a bit absent-minded at times, but her intellect and magical abilities are unmatched."
    },
    {
      "image_url": "/resources/img/avatar/human/small_human_warrior_m03.png",
      "name": "Aiden Blackwood",
      "age": 28,
      "gender": "Male",
      "race": "Human",
      "class": "Paladin",
      "character": "Aiden Blackwood is a holy warrior of the order of the Silver Hand. He was raised in a monastery, where he learned to wield both sword and divine magic. He travels the land, seeking to uphold justice and righteousness, and to vanquish evil wherever it may be found."
    }
  ];

  getPersonasFromConfig(callback) {
    let url = '/personas';          
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
          callback({"result": data});
        }).catch((error) => {
          console.error("Error fetching Personas", error);
          callback(false);
        });          
  }    
//createRandomPersona
  generateDMPersona(callback) {
    let url = '/generate_dm_persona';          
    fetch(url)
    .then((response) => response.json())
    .then((data) => {callback({
        "result": data
      })
    }).catch((error) => {
        console.error("Error fetching Personas", error);
    });          
  }

  submitDMPersona(callback) {
    let url='/submit_dm_persona';
    fetch(url,
    {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(this.DungeonMaster)
    })
    .then((response) => response.json())
    .then((data) => {callback(data)
      this.DungeonMaster.welcome_message=data.result;
    }).catch((error) => {
        console.error("Error fetching Personas", error);
    });
  }

  createParty(size, callback) {
    let url = '/random_party?party_size='+size;          
    fetch(url)
      .then((response) => response.json())
      .then((data) => {callback({
        "result": data
        });
      }).catch((error) => {
        console.error("Error fetching Personas", error);
    });
  }
  
  createHero(name, age, hclass, race, gender, story, image_url) {
    return {
        "name": name
      , "age": age
      , "gender": gender
      , "race": race
      , "class": hclass
      , "character": story
      , "image_url": image_url
    }
  }

  setHeroImageURL(hero,partyObj) {
    var url = `/get_avatar_url?race=${hero.race}&class=${hero.class}&gender=${hero.gender}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
          hero.image_url = data.result.url;
          console.log(hero.image_url );
          this.Party.pop()
          this.Party.push(hero)
      }).catch((error) => {
        console.error("Error fetching Personas", error);
    });

  }

  setHeroImages() {
    this.Party.forEach(obj => {
      console.log(obj)
      this.setHeroImageURL(obj,this.Party)
    });

    this.EventTarget.dispatchEvent(this.onPartyChanged)
  }
  /*
  dnd_gpt.EventTarget.addEventListener("onPartyChanged", (event) => {
    console.log("I'm listening on a custom event");
  });
  */


  addHero(hero) {
    Party.push(hero)
  }      
}