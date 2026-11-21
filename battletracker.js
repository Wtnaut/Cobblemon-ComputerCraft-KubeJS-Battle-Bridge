// ################### CONFIGURATIONS: CHANGE THESE TO YOUR NEEDS ###################################
const UPDATE_RATE = 20 
const INCLUDE_PVP = true //PvPlayer Battles
const INCLUDE_PVN = true //PvNPC Battles
const INCLUDE_PVW = true //PvWild Battles
var fileLocations = [
    'kubejs/data/battledata.json'
]
// ### EXAMPLE LOCATIONS ###
// SERVER COMPUTERCRAFT
// For Each Computer:
// 'world/computercraft/computer/<id>/battledata.json'
// PRIVATE WORLD COMPUTERCRAFT
// For Each Computer in Each World:
// 'saves/<worldname>/computer/<id>/battledata.json'

// ################ DO NOT CHANGE PAST THIS POINT (Unless you know what you're doing) ###############

// We are directly accessing Cobblemon's battle registry :)
// We also need to read BattleContexts. Kinda the whole point.
const Cobblemon = Java.loadClass('com.cobblemon.mod.common.Cobblemon')
const BattleRegistry = Java.loadClass('com.cobblemon.mod.common.battles.BattleRegistry')
const BattleContext = Java.loadClass('com.cobblemon.mod.common.api.battles.interpreter.BattleContext')
const BattleContextType = Java.loadClass('com.cobblemon.mod.common.api.battles.interpreter.BattleContext$Type')
const ActorType = Java.loadClass('com.cobblemon.mod.common.api.battles.model.actor.ActorType')

// Helper Function for Counting Alive Pokemon
function countAliveOnSide(battleSide) {
  var alive = 0
  battleSide.actors.forEach(actor => {
    actor.pokemonList.forEach(battlePokemon => {
      if (battlePokemon.effectedPokemon && battlePokemon.effectedPokemon.currentHealth > 0)
        alive++
    })
  })
  return alive
}

function getSideName(battleSide) {
    var actor = battleSide.actors[0]
    if (!actor) return "Unknown"
    return actor.getName().getString()
}

// Every N ticks, we update jsons across the server (all those listed in the configs above)
// Note that this doesn't catch the battles as they end! We'll actually have to do something else for that, probably.
// On the computercraft side, we could just play fireworks at the end fo a battle regardless i guess. 
ServerEvents.tick(event => {
    if (event.server.tickCount % UPDATE_RATE !== 0) return

    // We need to check all battles. 
    // Unfortunately, the 'kosher' way to do this is by accessing them by player, as it is a public method.
    // It also means we need to check and avoid dupes.
    let checkedBattles = new Set()
    let toSave = new Map()
    event.server.playerList.players.forEach(player => {

        let battle = BattleRegistry.INSTANCE.getBattleByParticipatingPlayer(player)
        if (battle == null) return
        if (battle.isPvP && INCLUDE_PVP == false) return
        if (battle.isPvN && INCLUDE_PVN == false) return
        if (battle.isPvW && INCLUDE_PVW == false) return

        let id = battle.battleId.toString()
        if (checkedBattles.has(id)) return
        checkedBattles.add(id)

        // Now that we know this battle is one we are interested in, we can grab contextmanagers
        // These basically keep track of all constant 'things' that affect pokemon
        // that includes status, weather, terrain, held items, abilities, etc
        let battleContextManager = battle.contextManager
        let side1ContextManager = battle.getSide1().getContextManager()
        let side2ContextManager = battle.getSide2().getContextManager()

        // We need to query the context managers here, since they can return null on lookup :)
        // WEATHER
        let weather = "none"
        var contexts = battleContextManager.get(BattleContextType.WEATHER)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               weather = ctx.id
            })
        }
        // TERRAIN
        let terrain = "none"
        contexts = battleContextManager.get(BattleContextType.TERRAIN)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               terrain = ctx.id
            })
        }
        // ROOM
        let room = "none"
        contexts = battleContextManager.get(BattleContextType.ROOM)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               room = ctx.id
            })
        }
        // MISC 
        let fairy_lock = "false"
        contexts = battleContextManager.get(BattleContextType.MISC)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "fairylock")
                    fairy_lock = "true"
            })
        }
        // GRAVITY
        let gravity = "false"
        contexts = battleContextManager.get(BattleContextType.GRAVITY)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               gravity = "true"
            })
        }
        // SPORTS
        let mud_sport = "false"
        let water_sport = "false"
        contexts = battleContextManager.get(BattleContextType.SPORT)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "mudsport")
                    mud_sport = "true"
                if(ctx.id == "watersport")
                    water_sport = "true"
            })
        }

        // Side 1
        let side1 = {
            light_screen: "false",
            reflect: "false",
            aurora_veil: "false",
            stealth_rock: "false",
            spikes: 0,
            toxic_spikes: 0,
            sticky_web: "false",
            tailwind: "false",
            alive_count: 0,
            name: ""
        }
        //SIDE 1 SCREENS
        contexts = side1ContextManager.get(BattleContextType.SCREEN)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "lightscreen")
                    side1.light_screen = "true"
                if(ctx.id == "reflect")
                    side1.reflect = "true"
                if(ctx.id == "auroraveil")
                    side1.aurora_veil = "true"
            })
        }
        //SIDE 1 HAZARDS
        contexts = side1ContextManager.get(BattleContextType.HAZARD)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "stealthrock")
                    side1.stealth_rock = "true"
                if(ctx.id == "spikes")
                    side1.spikes += 1
                if(ctx.id == "toxicspikes")
                    side1.toxic_spikes += 1
                if(ctx.id == "stickyweb")
                    side1.sticky_web = "true"
            })
        }
        //SIDE 1 TAILWIND
        contexts = side1ContextManager.get(BattleContextType.TAILWIND)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               side1.tailwind = "true"
            })
        }

        // Side 2
        let side2 = {
            light_screen: "false",
            reflect: "false",
            aurora_veil: "false",
            stealth_rock: "false",
            spikes: 0,
            toxic_spikes: 0,
            sticky_web: "false",
            tailwind: "false",
            alive_count: 0,
            name: ""
        }
        //SIDE 2 SCREENS
        contexts = side2ContextManager.get(BattleContextType.SCREEN)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "lightscreen")
                    side2.light_screen = "true"
                if(ctx.id == "reflect")
                    side2.reflect = "true"
                if(ctx.id == "auroraveil")
                    side2.aurora_veil = "true"
            })
        }
        //SIDE 2 HAZARDS
        contexts = side2ContextManager.get(BattleContextType.HAZARD)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
                if(ctx.id == "stealthrock")
                    side2.stealth_rock = "true"
                if(ctx.id == "spikes")
                    side2.spikes += 1
                if(ctx.id == "toxicspikes")
                    side2.toxic_spikes += 1
                if(ctx.id == "stickyweb")
                    side2.sticky_web = "true"
            })
        }
        //SIDE 2 TAILWIND
        contexts = side2ContextManager.get(BattleContextType.TAILWIND)
        if (contexts != null && !contexts.isEmpty()) {
            contexts.forEach(ctx => {
               side2.tailwind = "true"
            })
        }

        // Now, we update what requires actors on each side (I did these in subroutines, sue me)
        side1.alive_count = countAliveOnSide(battle.getSide1())
        side2.alive_count = countAliveOnSide(battle.getSide2())
        side1.name = getSideName(battle.getSide1())
        side2.name = getSideName(battle.getSide2())

        // We now store the data into this object as we please. We will store the object in a larger map,
        // which will be converted into a regular JS object and then saved to JSON
        let battleData = {
            turn: String(battle.turn),
            source_player: player.username.toString(),
            weather: weather,
            terrain: terrain,
            room: room,
            fairy_lock: fairy_lock,
            gravity: gravity,
            mud_sport: mud_sport,
            water_sport: water_sport,
            side1: side1,
            side2: side2
        }
        toSave.set(id, battleData)
    })
    // For each location we need to write to, we update it with the JSON
    for( var i = 0; i < fileLocations.length; i++)
        JsonIO.write(fileLocations[i], Object.fromEntries(toSave))
    
})
