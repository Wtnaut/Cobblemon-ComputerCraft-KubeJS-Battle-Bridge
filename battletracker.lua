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

-- Global Setup
local battles = {A = "Test1", B = "Test2", C = "Test3"}
local maxIndex = 16
battle_id = ""
swap_sides = false

-- Processing Loop
while (true) do
  -- Update JSON data
  -- TODO

  -- Update the monitor screen
  term.clear()
  term.setCursorPos(1,1)
  term.setTextColour(colours.white)
  term.write("Select Battle:")
  term.setCursorPos(1,2)
  term.setTextColour(colours.red)
  term.write("Clear Selection")
  term.setTextColour(colours.white)

  -- For Each Battle in our list (To Be Updated!)
  local keys = {}
  for k in pairs(battles) do
    table.insert(keys, k)
  end
  table.sort(keys) --We can amend this to be by length of time?

  local index = 3 --Start past where we've already written
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
      term.setBackgroundColour(colours.gold)
    end
    term.setCursorPos(5, index)
    term.write(battles[k])
    index = index + 1
    if k == battle_id then
        term.setBackgroundColour(colours.black)
    end
    if index > maxIndex then
        break
    end
  end
  
  -- Wait for User Input & Update Battles
  local event, side, x, y = pullEventTimeout(1, "monitor_touch") -- Poll for events, timeout after one second
  if y ~= nil then
    if keys[y-2] ~= nil then
      if keys[y-2] == battle_id and x <= 3 then
        swap_sides = not swap_sides
      else
        battle_id = keys[y-2]
      end
    elseif y == 2 then
      battle_id = ""
      swap_sides = false
    end
  end
end
