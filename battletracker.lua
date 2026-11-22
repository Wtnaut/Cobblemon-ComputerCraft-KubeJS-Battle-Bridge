-- CONSTANTS - CHANGE THESE TO POINT TO BATTLE DATA
local BATTLE_PATH = "battledata.json"

-- Helper Functions
local function pullEventTimeout(timeout, filter)
  local timer = os.startTimer(timeout)
  while true do
    local event = { os.pullEvent() }
    if event[1] == "timer" and event[2] == timer then
      return nil -- Timed out
    elseif not filter or event[1] == filter then
      os.cancelTimer(timer)
      return table.unpack(event)
    end
  end
end

local function getBattleDataFromJSON(path)
  local data_file = fs.open(path, "r")
  if not data_file then 
    return {} 
  end
  local raw_battle_data = data_file.readAll()
  data_file.close()
  return textutils.unserializeJSON(raw_battle_data) or {}
end
  

-- Global Setup
local mon = peripheral.find("monitor")
assert(mon, "No monitor found! Attach an Advanced Monitor.")
mon.setTextScale(1)
local oldTerm = term.redirect(mon)

local battles = {}
battle_id = ""
swap_sides = false

-- Processing Loop
local ok, err = pcall(function()
while true do
    -- Update JSON data
    battles = getBattleDataFromJSON(BATTLE_PATH)

    -- Update the monitor screen
    local size_w, size_h = term.getSize()
    term.clear()
    term.setCursorPos(1,1)
    term.setTextColour(colours.white)
    term.setBackgroundColour(colours.black)
    term.write("Select Battle:")
    term.setCursorPos(1, size_h - 1)
    term.setTextColour(colours.yellow)
    term.write("[Clear Selection]")
    term.setCursorPos(1,size_h)
    term.setTextColour(colours.red)
    term.write("[Quit to Terminal]")
    term.setBackgroundColour(colours.black)
    term.setTextColour(colours.white)

    -- For Each Battle in our list (To Be Updated!)
    local keys = {}
    for k in pairs(battles) do
        table.insert(keys, k)
    end
    table.sort(keys) --We can amend this to be by length of time?

    local index = 2 --Start past where we've already written
    for _, k in ipairs(keys) do
        term.setCursorPos(4, index)
        term.write("|")
        if k == battle_id then
        if swap_sides then
            term.setBackgroundColour(colours.red)
        else
            term.setBackgroundColour(colours.green)
        end
        term.setCursorPos(1, index)
        term.write("SWP")
        term.setBackgroundColour(colours.orange)
        end
        term.setCursorPos(5, index)
        term.write(battles[k].side1.name .. " VS " .. battles[k].side2.name)
        index = index + 1
        if k == battle_id then
            term.setBackgroundColour(colours.black)
        end
        if index > size_h-2 then
            break
        end
    end
    -- INSERT YOUR PROCESSING HERE
    --TODO
    
    -- Wait for User Input & Update Battles
    local event, side, x, y = pullEventTimeout(1, "monitor_touch") -- Poll for events, timeout after one second
    if y ~= nil and side ~= nil then
        if side == peripheral.getName(mon) then
            if y == size_h-1 then
                battle_id = ""
                swap_sides = false
            elseif y == size_h then
                term.clear()
                break
            elseif keys[y-1] ~= nil then
                if keys[y-1] == battle_id and x <= 3 then
                    swap_sides = not swap_sides
                else
                    battle_id = keys[y-1]
                end
            end
        end
    end
end
end)

term.redirect(oldTerm)

if not ok then
  printError(err)
end
