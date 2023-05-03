class DnGPT {

  DungeonMaster;
  Party = [];

  /* Default Party */
  onPartyChanged = new CustomEvent("onPartyChanged", {
    detail: {},
    bubbles: true,
    cancelable: true,
    composed: false,
  });

  // Events will lock into EventTarget Object. Add Listener if needed.
  EventTarget = new EventTarget();


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

  generateParty(size, callback) {
    let url = '/random_party?party_size='+size;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.Party=data;
        this.EventTarget.dispatchEvent(this.onPartyChanged)            
        if (callback) {
          callback({"result": data});
        }
      }).catch((error) => {
        console.error("Error fetching Personas", error);
    });
  }

  defaultParty(size, callback) {
    let url = '/default_party?party_size='+parseInt(size);
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.Party=data;
        this.EventTarget.dispatchEvent(this.onPartyChanged)
        if (callback) {
          callback({"result": data});
        }    
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

  setHeroImageURL(hero_idx) {
    var hero=this.Party[hero_idx];
    console.log(hero);

    var url = `/get_avatar_url?race=${hero.race}&class=${hero.class}&gender=${hero.gender}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
          this.Party[hero_idx].image_url = data.result.url;
          console.log(hero_idx +' '+ this.Party.length);
          if (hero_idx==this.Party.length-1) {
            this.EventTarget.dispatchEvent(this.onPartyChanged)            
          }
      }).catch((error) => {
        console.error("Error fetching Personas", error);
    });
  }

  setHeroImages() {
    for (var i=0;i<this.Party.length;i++) {
      this.setHeroImageURL(i);
    }
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
