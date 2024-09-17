-- import module
local json = require('json')
local math = require('math')

local request = require('lib.request')
local response = require('lib.response')
local global = require('global')

-- 全局变量

-- 事件订阅者
Listeners = Listeners or {}

-- 侦听进程
LisenterProcesses = { global.ProcessID.User, global.ProcessID.Store }

-- 免费赠送记录
Freegets = Freegets or {}

-- 免费赠送种子
EnabledFreegetSeed = true

-- 免费赠送种子数量
FreegetSeedAmount = 10

-- 用户物品
Inventories = Inventories or {}

-- 用户田地
Fields = Fields or {}

-- 种植中的田地
PlantingFields = PlantingFields or {}

-- 免费赠送田地
EnabledFreegetField = true

-- 免费赠送田地数量
FreegetFieldAmount = 10

-- 最大果实产量
MaxFieldFruitAmount = 10

-- 最小果实产量
MinFieldFruitAmount = 6

-- 农场记录
FarmLogs = FarmLogs or {}

-- 农场名称
FarmNames = FarmNames or {}

-- 农场公告
FarmNotices = FarmNotices or {}

-- 玩家推特
FarmTwitters = FarmTwitters or {}

-- 是否赠送狗狗
EnabledFreegetDog = true

-- 是否开启偷摘
EnabledSteal = true

-- 偷摘最小数量
StealMinAmount = 1

-- 偷摘最大数量
StealMaxAmount = 3

-- 是否有守卫
Guardeds = Guardeds or {}

-- 正关注列表
Following = Following or {}

-- 关注者列表
Followers = Followers or {}

-- 总农场数
TotalFarm = 0

-- 访问量
VisitCounts = VisitCounts or {}

-- 访问者
Visits = Visits or {}

-- 是否开启浇水
EnabledWatering = true

-- 最大浇水次数, 未达到最大浇水次数，则产量达不到最大值
MaxWateringTimes = 4

-- 推荐农场数量
RecommendFarmCount = 100

-- 生长周期
GrowthCycle = {}
-- GrowthCycle[global.SeedPhase.SEED] = 6 * 60 * 60 * 1000
-- GrowthCycle[global.SeedPhase.BURGEON] = 6 * 60 * 60 * 1000
-- GrowthCycle[global.SeedPhase.GROWTH] = 6 * 60 * 60 * 1000
-- GrowthCycle[global.SeedPhase.BLOOM] = 6 * 60 * 60 * 1000
-- GrowthCycle[global.SeedPhase.FRUIT] = 0

-- only testing
GrowthCycle[global.SeedPhase.SEED] = 2 * 60 * 1000
GrowthCycle[global.SeedPhase.BURGEON] = 2 * 60 * 1000
GrowthCycle[global.SeedPhase.GROWTH] = 2 * 60 * 1000
GrowthCycle[global.SeedPhase.BLOOM] = 2 * 60 * 1000
GrowthCycle[global.SeedPhase.FRUIT] = 0

-- 初始化
function Init()
     -- 侦听进程
     for _, value in pairs(LisenterProcesses) do
        ao.send({
            Target = value,
            Action = 'RegisterListener',
            Module = 'Farm',
        })  
    end

    -- 增加属性
    -- for key, value in pairs(Fields) do
    --     for _, val in ipairs(value) do
    --         val.StealedAmount = val.StealedAmount or 0
    --     end
    -- end

    print('Farm process init success')
end

-- 取消所有侦听
function RemoveAllListener() 
    for key, value in pairs(LisenterProcesses) do
        ao.send({
            Target = value,
            Action = 'RemoveListener',
            Module = 'Farm',
        })  
    end
end

-- 随机排序列表
local function shuffle(list)
	local n = #list
    for i = 1, n do
            local j, k = math.random(1,n), math.random(1,n)
            list[j], list[k] = list[k], list[j]
    end
    return list
end

-- 获取农场信息
local function getFarmInfo(player)
    local farmInfo = {
        Player = player,
        CanFreegetDog = EnabledFreegetDog and not Guardeds[player],
        Fields = Fields[player] or {},
        Inventories = Inventories[player] or {},
        FarmLogs = FarmLogs[player] or {},
        FarmName = FarmNames[player] or ('Farm-' .. player),
        Guarded = Guardeds[player] or false,
        Notice = FarmNotices[player] or 'Welcome to my farm',
        Twitter = FarmTwitters[player] or '',
        Timestamp = os.time(),
    }

    return farmInfo
end

-- 获取农场信息
local function getFarmBrief(player)
    local farmInfo = {
        Player = player,
        Name = FarmNames[player] or '',
        Notice = FarmNotices[player] or '',
        VisitCount = VisitCounts[player] or 0,
    }

    return farmInfo
end

-- 根据浇水次数获地块取产量
local function getRandomFruitAmount(field)
    if EnabledWatering then
        if field.WateredTimes >= MaxWateringTimes then
            return MaxFieldFruitAmount
        end
    
        return math.random(MinFieldFruitAmount + field.WateredTimes, MaxFieldFruitAmount)    
    end
    
    return MaxFieldFruitAmount
end

-- 获取随机玩家
local function getRandomPlayer(excludedPlayers)
    local players = {}

    for key, _ in pairs(FarmNames) do
        if not excludedPlayers or not excludedPlayers[key] then
            players[#players+1] = key
        end
    end

    local index = math.random(1, #players)

    print('Player index: ' .. index .. ', Player: ' .. players[index])

    return players[index]
end

function GetRandomPlayer()
    return getRandomPlayer()
end

-- 重置地块
local function resetField(field)
    field.Planting = false
    field.SeedType = ''
    field.SeedPhase = ''
    field.PlantedTime = 0
    field.PlantedBlock = 0
    field.NextPhase = ''
    field.NextPhaseTime = 0
    field.IsStealed = false
    field.HarvestedTime = 0
    field.HarvestedBlock = 0
    field.FruitAmount = 0
    field.Watered = false
    field.WateredTimes = 0
    field.StealedAmount = 0
    field.StealedTimes = 0
end

-- 重置玩家地块
function ResetFields(player)
    for _, field in ipairs(Fields[player]) do
        resetField(field)
    end
end

-- 免费赠送物品
function FreegetInventory(player, category, subCategory, amount)
    Inventories[player] = Inventories[player] or {}

    for _, value in ipairs(Inventories[player]) do
        if value.Category == category and value.SubCategory == subCategory then
            value.Amount = value.Amount + amount
            return
        end
    end

    Inventories[player][#Inventories[player]+1] = {
        Category = category,
        SubCategory = subCategory,
        Amount = amount
    }
end

-- 赠送田地
function FreegetField(player, amount)
    Fields[player] = Fields[player] or {}

    for i = 1, amount do
        Fields[player][#Fields[player]+1] = {
            Id = #Fields[player]+1,
            Owner = player,
            Planting = false,
            SeedType = '',
            SeedPhase = '',
            PlantedTime = 0,
            PlantedBlock = 0,
            NextPhase = '',
            NextPhaseTime = 0,
            HarvestedTime = 0,
            HarvestedBlock = 0,
            IsStealed = false,
        }
    end
end

function LoopPlantingFields()
    print('PlantingFields count: ' .. #PlantingFields)
    for key, value in pairs(PlantingFields) do
        print('Player: ' .. value.Owner .. ', Field ' .. value.Id .. ', SeedType: ' .. value.SeedType .. ', NextPhaseTime: ' .. value.NextPhaseTime)
    end
end

-- 获取下一个生长阶段
local function getNextPhase(currentPhase)
    if currentPhase == global.SeedPhase.SEED then
        return global.SeedPhase.BURGEON
    elseif currentPhase == global.SeedPhase.BURGEON then
        return global.SeedPhase.GROWTH
    elseif currentPhase == global.SeedPhase.GROWTH then
        return global.SeedPhase.BLOOM
    elseif currentPhase == global.SeedPhase.BLOOM then
        return global.SeedPhase.FRUIT
    elseif currentPhase == global.SeedPhase.FRUIT then
        return global.SeedPhase.FRUIT
    end
end

-- 是否已结果实
local function isFruited(field)
    return field.SeedPhase == global.SeedPhase.FRUIT
end

-- 是否偷摘成功
local function isStealSuccess()
    local value = math.random(1, 10)

    print('Steal value: ' .. value .. ', success: ' .. tostring(value <= 5))
    return value <= 50
end

function IsStealSuccess()
    return isStealSuccess()
end

-- 收获
local function harvestField(player, field)
    print('Player ' .. player .. ' harvest, FieldId: ' .. field.Id .. ', SeedType: ' .. field.SeedType 
            .. ', Amount: ' .. field.FruitAmount .. ', Timestamp: ' .. os.time())

    local inventory = nil
    for _, value in ipairs(Inventories[player]) do
        if value.Category == global.InventoryCategory.FRUIT and value.SubCategory == field.SeedType then
            inventory = value
            break
        end
    end

    -- 收获
    if inventory ~= nil then
        inventory.Amount = inventory.Amount + field.FruitAmount
    else
        Inventories[player][#Inventories[player]+1] = {
            Category = global.InventoryCategory.FRUIT,
            SubCategory = field.SeedType,
            Amount = field.FruitAmount
        }
    end

    -- 农场日志
    FarmLogs[player] = FarmLogs[player] or {}
    FarmLogs[player][#FarmLogs+1] = {
        FieldId = field.Id,
        SeedType = field.SeedType,
        CreatedTime = os.time(),
        Owner = field.Owner,
        Player = player,
        Action = 'Harvest',
        Description = 'Player ' .. player .. ' has harvested ' ..field.FruitAmount .. ' ' .. field.SeedType .. ' in field ' .. field.Id
    }

    -- 重置地块
    resetField(field)

    -- 移除种植中的记录
    PlantingFields[field.Owner .. '_' .. tostring(field.Id)] = nil
end

-- 生成随机数
local function generateRandomNumber(min, max)
    return math.random(min, max)
end

-- 偷摘
local function stealField(player, field) 
    -- 增加偷摘次数
    field.StealedTimes = field.StealedTimes + 1

    -- 随机偷摘数量
    local stealMaxAmount = StealMaxAmount
    if field.FruitAmount < StealMaxAmount then
        stealMaxAmount = field.FruitAmount
    end

    -- 偷摘数量
    local stealedAmount = 0

    -- 是否有狗狗守卫
    if Guardeds[field.Owner] then
        -- 有守卫, 检查是否偷摘成功
        if isStealSuccess() then
            -- 偷摘成功, 随机偷摘数量
            stealedAmount = math.random(StealMinAmount, stealMaxAmount)
        else
            -- 偷摘失败
            print('Steal failure, Player: ' .. player .. ', FieldId: ' .. field.Id)
            return 0
        end
    else
        -- 无守卫, 随机偷摘数量
        stealedAmount = math.random(StealMinAmount, stealMaxAmount)
    end

    print('Player ' .. player .. ' steal, FieldId: ' .. field.Id .. ', Owner: ' .. field.Owner .. ', SeedType: ' 
        .. field.SeedType.. ', Amount:' .. stealedAmount .. ', Timestamp: ' .. os.time())

    -- 更新地块状态
    field.IsStealed = true
    field.FruitAmount = field.FruitAmount - stealedAmount
    field.StealedAmount = stealedAmount

    -- 增加玩家物品
    local inventory = nil
    for _, value in ipairs(Inventories[player]) do
        if value.Category == global.InventoryCategory.FRUIT and value.SubCategory == field.SeedType then
            inventory = value
            break
        end
    end

    if inventory ~= nil then
        inventory.Amount = inventory.Amount + stealedAmount
    else
        Inventories[player][#Inventories[player]+1] = {
            Category = global.InventoryCategory.FRUIT,
            SubCategory = field.SeedType,
            Amount = stealedAmount
        }
    end

    -- 农场日志
    FarmLogs[field.Owner] = FarmLogs[field.Owner] or {}
    FarmLogs[field.Owner][#FarmLogs+1] = {
        FieldId = field.Id,
        SeedType = field.SeedType,
        CreatedTime = os.time(),
        Owner = field.Owner,
        Player = player,
        Action = 'Harvest',
        Description = 'Player ' .. player .. ' has stealed ' .. stealedAmount .. ' ' .. field.SeedType .. ' in field ' .. field.Id
    }

    return stealedAmount
end

-- Action

-- Ping
Handlers.add(
    'ping', 
    Handlers.utils.hasMatchingTag('Action', 'Ping'),
    function(msg) 
        print('message id: ' .. msg.Id .. ', msg: ' .. json.encode(msg))
        msg.reply({ Data = 'Pong'})
    end
)

-- 获取用户田地信息
Handlers.add(
    'getFarmInfo', 
    Handlers.utils.hasMatchingTag('Action', 'GetFarmInfo'),
    function(msg) 
        print('Get farm info, Player: ' .. msg.Tags['Player'] .. ', Timestamp: ' .. msg.Timestamp)
        local player = msg.Tags['Player'] or msg.From

        -- 返回玩家农场信息
        local farmInfo = getFarmInfo(player)

        -- 增加访问量
        if player ~= msg.From then
            VisitCounts[player] = VisitCounts[player] or 0
            VisitCounts[player] = VisitCounts[player] + 1
        end

        msg.reply({ Data = response.getSuccessResponse(farmInfo) })
    end
)


-- 广播事件
local function notify(event, data)
    print('Farm Notify, Event: ' .. event .. ', Data: ' .. json.encode(data))
    for _, address in pairs(Listeners) do
        ao.send({
            Target = address,
            Action = "Notify",
            Event = event,
            Data = data
        })
    end
  end
  
  -- 移除侦听者
  local function removeListener(listener)
    local idx = 0
    for i, v in ipairs(Listeners) do
        if v == listener then
            idx = i
            break
        end
    end
    if idx > 0 then
        table.remove(Listeners, idx)
    end
  end

-- 处理通知
Handlers.add(
  "handleNotify",
  Handlers.utils.hasMatchingTag("Action", "Notify"),
  function (msg)
    -- 用户模块
    if msg.From == global.ProcessID.User then
        print('Notify from User Module, Process: ' .. msg.From .. ", Event: " .. msg.Event .. ', Data: ' .. json.encode(msg.Data))
        if msg.Event == 'NewPlayerRegistered' then
            local player = msg.Data

            -- 新用户注册, 总农场数加1
            TotalFarm = TotalFarm + 1

            -- 访问量初始化
            VisitCounts[player] = 0

            -- 农场名称
            FarmNames[player] = 'Farm-' .. player

            -- 关注列表与关注者列表
            Following[player] = {}
            Followers[player] = {}

            -- 免费赠送记录
            Freegets[player] = Freegets[player] or {}

            -- 赠送田地
            if EnabledFreegetField and FreegetFieldAmount > 0 then
                local freegetField = nil
                for index, value in ipairs(Freegets[player]) do
                    if value.Category == global.FreegetCategory.REGISTRATION and value.Type == global.FreegetType.FIELD then
                        freegetField = value
                        break
                    end
                end

                if freegetField == nil then
                    -- 增加赠送记录
                    Freegets[player][#Freegets[player]+1] = {
                        Category = global.FreegetCategory.REGISTRATION,
                        Type = global.FreegetType.FIELD,
                        Amount = FreegetFieldAmount,
                        Timestamp = msg.Timestamp,
                    }

                    -- 增加地块
                    Fields[player] = Fields[player] or {}

                    for i = 1, FreegetFieldAmount do
                        Fields[msg.Data][i] = {
                            Id = i, -- 地块ID
                            Owner = player, -- 拥有者
                            Planting = false, -- 是否种植中
                            SeedType = '', -- 种子类型
                            SeedPhase = '', -- 种子阶段
                            PlantedTime = 0, -- 种植时间
                            PlantedBlock = 0, -- 种植区块高度
                            NextPhase = '', -- 下一个生长阶段
                            NextPhaseTime = 0, -- 下一个生长阶段时间
                            HarvestedTime = 0, -- 收获时间
                            HarvestedBlock = 0, -- 收获区块高度
                            IsStealed = false, -- 是否被偷
                            StealedTimes = 0, -- 偷摘的次数
                            StealedAmount = 0, -- 偷摘数量
                            FruitAmount = 0, -- 果实数量
                            WateredTimes = 0, -- 浇水次数
                            Watered = false, -- 是否浇水
                        }
                    end

                    print("New player " .. player .. ' registered, freeget ' .. tostring(FreegetFieldAmount) .. ' fields')
                else
                    print('Freeget field already received, Player: ' .. player)
                end
            end

             -- 赠送种子
            if EnabledFreegetSeed and FreegetSeedAmount > 0 then
                local freegetSeed = nil
                for index, value in ipairs(Freegets[player]) do
                    if value.Category == global.FreegetCategory.REGISTRATION and value.Type == global.FreegetType.SEED then
                        freegetSeed = value
                        break
                    end
                end

                if freegetSeed == nil then
                   -- 增加赠送记录
                    Freegets[player][#Freegets[player]+1] = {
                        Category = global.FreegetCategory.REGISTRATION,
                        Type = global.FreegetType.SEED,
                        Amount = FreegetSeedAmount,
                        Timestamp = msg.Timestamp,
                    }

                    -- 增加种子物品
                    Inventories[player] = Inventories[player] or {}
                    Inventories[player][#Inventories[player]+1] = {
                        Category = global.InventoryCategory.SEED,
                        SubCategory = global.SeedType.APPLE,
                        Amount = FreegetSeedAmount
                    }

                    print('New player ' .. player .. ' registered, freeget ' .. tostring(FreegetSeedAmount) .. ' seeds')
                else
                    print('Freeget seed already received, Player: ' .. player)
                end
            end
        elseif msg.Event == 'BuyDeductSuccess' then
            -- 购买扣款成功
            local eventData = msg.Data

            -- 增加物品
            Inventories[eventData.Player] = Inventories[eventData.Player] or {}

            local inventory = nil
            for _, value in ipairs(Inventories[eventData.Player]) do
                if value.Category == eventData.Category and value.SubCategory == eventData.SubCategory then
                    inventory = value
                    break
                end
            end

            if inventory ~= nil then
                inventory.Amount = inventory.Amount + eventData.Amount
            else
                Inventories[eventData.Player][#Inventories[eventData.Player]+1] = {
                    Category = eventData.Category,
                    SubCategory = eventData.SubCategory,
                    Amount = eventData.Amount,
                }
            end

            -- 如果是狗狗，则增加守卫
            if eventData.Category == global.InventoryCategory.ANIMAL and eventData.SubCategory == global.AnimalType.DOG then
                Guardeds[eventData.Player] = true
            end
        elseif msg.Event == 'BuyDeductFailure' then
            -- 购买扣款失败
            local eventData = msg.Data
            print('Buy deduct failure, data: ' .. json.encode(eventData))
        end
    elseif msg.From == global.ProcessID.Store then
        print('Notify from Store Module, Process: ' .. msg.From .. ", Event: " .. msg.Event .. ', Data: ' .. json.encode(msg.Data))
        if msg.Event == 'Sell' then
            -- 出售通知
            local eventData = msg.Data

            local inventory = nil
            for _, value in ipairs(Inventories[eventData.Player]) do
                if value.Category == eventData.Category and value.SubCategory == eventData.SubCategory then
                    inventory = value
                    break
                end
            end

            if inventory == nil then
                msg.reply({ Data = 'Sell request failure, inventory not found, ' .. json.encode(eventData) })
                return
            end

            -- 检查果实数量
            if inventory.Amount < eventData.Amount then
                msg.reply({ Data = 'Insufficient inventory, ' .. json.encode(eventData) })
                return
            end

            -- 扣除果实
            inventory.Amount = inventory.Amount - eventData.Amount

            print('Sell deduct success, ' .. json.encode(eventData))

            -- 返回结果
            msg.reply({ Data = 'Sell request success, ' .. json.encode(eventData) })

            -- 广播事件
            notify('SellDeductSuccess', {
                Player = eventData.Player,
                Category = eventData.Category,
                SubCategory = eventData.SubCategory,
                Amount = eventData.Amount,
                Price = eventData.Price,
                TotalPrice = eventData.TotalPrice,
            })
        end
    else
        print('Notify received from unknown module, Process: ' .. msg.From .. ', Data: ' .. json.encode(msg.Data))
    end
  end
)

-- 注册侦听者
Handlers.add(
    'registerListener', 
    Handlers.utils.hasMatchingTag('Action', 'RegisterListener'),
    function(msg) 
        print('Register listener, Process: ' .. msg.From .. ', Module: ' .. msg.Tags['Module'] .. ', Timestamp: ' .. msg.Timestamp)

        removeListener(msg.From)
        table.insert(Listeners, msg.From)

        msg.reply({ Data = 'Listener register success' })
    end
)

-- 移除侦听者
Handlers.add(
    'removeListener', 
    Handlers.utils.hasMatchingTag('Action', 'RemoveListener'),
    function(msg) 
        print('Remove listener, Process: ' .. msg.From .. ', Module: ' .. msg.Tags['Module'] .. ', Timestamp: ' .. msg.Timestamp)

        removeListener(msg.From)
        msg.reply({ Data = 'Listener remove success' })
    end
)

-- 种植
Handlers.add(
    'plant', 
    Handlers.utils.hasMatchingTag('Action', 'Plant'),
    function(msg)   
        print('Player ' .. msg.From .. ' plant request, Seed: ' .. msg.Tags['SeedType'] .. ', FieldId: ' 
            .. msg.Tags['FieldId'] .. ', Timestamp: ' .. msg.Timestamp)

        -- 田地ID
        local fieldId = tonumber(msg.Tags['FieldId'])

        -- 查找田地
        local field = nil
        for _, value in ipairs(Fields[msg.From]) do
            if value.Id == fieldId then
                field = value
                break
            end
        end

        if field == nil then
            msg.reply({ Data = response.getFailureResponse('Field not found') })
            return
        end

        -- 检查田地拥有者
        if field.Owner ~= msg.From then
            msg.reply({ Data = response.getFailureResponse('Field not belong to player') })
            return
        end

        -- 检查田地是否已经种植
        if field.Planting then
            msg.reply({ Data = response.getFailureResponse('Field already planted') })
            return            
        end

        -- 种子类型
        local seedType = msg.Tags['SeedType']

        -- 查找种子
        local inventory = nil
        for _, value in ipairs(Inventories[msg.From]) do
            if value.Category == global.InventoryCategory.SEED and value.SubCategory == seedType then
                inventory = value
                break
            end
        end

        if inventory == nil then
            msg.reply({ Data = response.getFailureResponse('Seed not found') })
            return
        end

        if inventory.Amount <= 0 then
            msg.reply({ Data = response.getFailureResponse('Seed not enough') })
            return
        end

        -- 扣除种子数量
        inventory.Amount = inventory.Amount - 1

        -- 更新田种植状态
        field.Planting = true
        field.SeedType = seedType
        field.SeedPhase = global.SeedPhase.SEED
        field.PlantedTime = msg.Timestamp
        field.PlantedBlock = msg['Block-Height']
        field.NextPhase = getNextPhase(global.SeedPhase.SEED)
        field.NextPhaseTime = msg.Timestamp + GrowthCycle[global.SeedPhase.SEED]
        field.HarvestedTime = 0
        field.HarvestedBlock = 0

        -- 增加种植中的记录
        PlantingFields[field.Owner .. '_' .. tostring(field.Id)] = field

        -- 农场日志
        FarmLogs[msg.From] = FarmLogs[msg.From] or {}
        FarmLogs[msg.From][#FarmLogs+1] = {
            FieldId = fieldId,
            SeedType = seedType,
            CreatedTime = msg.Timestamp,
            Owner = field.Owner,
            Player = msg.From,
            Action = 'Plant',
            Description = 'Player ' .. msg.From .. ' has planted ' .. seedType .. ' in field ' .. fieldId
        }

        -- 返回成功
        msg.reply({ Data = response.getSuccessResponse('Plant success') })

        -- 广播事件
        notify('Planted', {
            Player = msg.From,
            FieldId = fieldId,
            SeedType = seedType,
            PlantedTime = msg.Timestamp,
        })

        print('Player ' .. msg.From .. ' plant success, FieldId: ' .. tostring(fieldId) .. ', SeedType: ' .. seedType .. ', PlantedTime: ' .. msg.Timestamp)
    end
)

-- 测试请求
Handlers.add(
    'requestTest', 
    Handlers.utils.hasMatchingTag('Action', 'RequestTest'),
    function(msg) 
        print('Request test, msg: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp .. ', OSTime: ' .. os.time())
        for key, field in pairs(PlantingFields) do
            print('key: ' .. key .. ', Player ' .. field.Owner .. ', Field ' .. field.Id .. ', SeedType: ' .. field.SeedType .. ', NextPhaseTime: ' .. field.NextPhaseTime)
            print('Field ' .. field.Id .. ', SeedType: ' .. field.SeedType .. ', NextPhaseTime: ' .. field.NextPhaseTime)
        end
    end
)

-- 收获
Handlers.add(
    'harvest', 
    Handlers.utils.hasMatchingTag('Action', 'Harvest'),
    function(msg) 
        print('Player ' .. msg.From .. ' harvest request, FieldId: ' .. msg.Tags['FieldId'] 
                .. ', Owner: ' .. (msg.Tags['FieldOwner'] or '') .. ', Timestamp: ' .. msg.Timestamp)

        -- 地块拥有者
        local fieldOwner = msg.Tags['FieldOwner'] or msg.From

         -- 地块ID
         local fieldId = tonumber(msg.Tags['FieldId'])
         if not fieldId or fieldId <= 0 then
             msg.reply({ Data = response.getFailureResponse('FieldId is invalid') })
             return
         end
         
         -- 查找田地
         local field = nil
         for _, value in ipairs(Fields[fieldOwner]) do
             if value.Id == fieldId and fieldOwner == value.Owner then
                 field = value
                 break
             end
         end
 
         if field == nil then
             print('Field not found, FieldId: ' .. fieldId .. ', Owner: ' .. fieldOwner)
             msg.reply({ Data = response.getFailureResponse('Field not found') })
             return
         end
 
         -- 检查田地是否已经种植
         if not field.Planting then
             print('Field not planted, FieldId: ' .. fieldId)
             msg.reply({ Data = response.getFailureResponse('Field not planted') })
             return
         end
 
         -- 检查是否已经成熟
         if not isFruited(field) then
             print('Field not fruited, FieldId: ' .. fieldId .. ', Seed phase: ' .. field.SeedPhase)
             msg.reply({ Data = response.getFailureResponse('Field not fruited') })
             return
         end
 
         -- 是否开启偷摘
         if not EnabledSteal then
             -- 检查田地拥有者
             if field.Owner ~= msg.From then
                 print('Field not belong to player, FieldId: ' .. fieldId)
                 msg.reply({ Data = response.getFailureResponse('Field not belong to player') })
                 return
             end
         else
             -- 检查是否已经被偷
             if field.Owner ~= msg.From and field.IsStealed then
                 print('Field already stealed, FieldId: ' .. fieldId)
                 msg.reply({ Data = response.getFailureResponse('Field already stolen') })
                 return
             end
         end
 
         local seedType = field.SeedType
 
         if msg.From == field.Owner then
             -- 收获
             harvestField(msg.From, field)

             local data = {
                Player = msg.From,
                FieldId = fieldId,
                Owner = field.Owner,
                SeedType = seedType,
                Amount = field.FruitAmount,
                IsStealed = false,
                Time = msg.Timestamp,
            }
 
             -- 返回结果
             msg.reply({ Data = response.getSuccessResponse(data) })
 
             -- 广播事件, 通知订阅者
             notify('Harvested', data)
         else
             -- 偷摘
             stealField(msg.From, field)

             local data = {
                Player = msg.From,
                FieldId = fieldId,
                Owner = field.Owner,
                SeedType = seedType,
                Amount = field.StealedAmount,
                IsStealed = true,
                Time = msg.Timestamp,
             }
 
             -- 返回结果
             msg.reply({ Data = response.getSuccessResponse(data) })
 
             -- 广播事件, 通知订阅者
             notify('Stealed', data)
         end   
           
    end
)

-- 获取用户田地信息
Handlers.add(
    'getFields', 
    Handlers.utils.hasMatchingTag('Action', 'GetFields'),
    function(msg) 
        msg.reply({ Data = response.getSuccessResponse(Fields[msg.From]) })
    end
)

-- 获取所有田地
Handlers.add(
    'getAllFields', 
    Handlers.utils.hasMatchingTag('Action', 'GetAllFields'),
    function(msg) 
        msg.reply({ Data = 'Harvest success' })
    end
)

-- 获取已种值的田地
Handlers.add(
    'getPlantingFields', 
    Handlers.utils.hasMatchingTag('Action', 'GetPlantingFields'),
    function(msg) 
        msg.reply({ Data = response.getSuccessResponse(PlantingFields) })
    end
)

-- 获取种子阶段
Handlers.add(
    'getSeedPhases', 
    Handlers.utils.hasMatchingTag('Action', 'GetSeedPhases'),
    function(msg) 
        local phases = global.SeedPhase.SEED .. ', ' 
            .. global.SeedPhase.BURGEON .. ', ' 
            .. global.SeedPhase.GROWTH .. ', ' 
            .. global.SeedPhase.BLOOM .. ', ' 
            .. global.SeedPhase.FRUIT
        msg.reply({ Data = response.getSuccessResponse(phases) })
    end
)

-- 获取物件
Handlers.add(
    'getInventory', 
    Handlers.utils.hasMatchingTag('Action', 'GetInventory'),
    function(msg) 
        print('Get inventory, Player: ' .. msg.Tags['Player'] .. ', Category: ' .. msg.Tags['Category'] .. ', SubCategory: ' .. msg.Tags['SubCategory'])

        local player = msg.Tags['Player'] or msg.From
        local category = msg.Tags['Category']
        local subCategory = msg.Tags['SubCategory']

        local inventory = nil
        for _, value in ipairs(Inventories[player]) do
            if value.Category == category and value.SubCategory == subCategory then
                inventory = value
                break
            end
        end

        if inventory == nil then
            inventory = {
                Player = player,
                Category = category,
                SubCategory = subCategory,
                Amount = 0
            }
        end

        msg.reply({ Data = response.getSuccessResponse(inventory) })
    end
)

-- 定时任务
Handlers.add(
    "CronTick", -- handler name
    Handlers.utils.hasMatchingTag("Action", "Cron"), -- handler pattern to identify cron message
    function(msg) -- handler task to execute on cron message
        print('Cron tick, From: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)

        -- 遍历种值中的田地
        for key, value in pairs(PlantingFields) do
            if value.NextPhaseTime <= msg.Timestamp then
                -- 更新田地生长状态
                value.SeedPhase = value.NextPhase
                value.NextPhase = getNextPhase(value.SeedPhase)
                value.NextPhaseTime = msg.Timestamp + GrowthCycle[value.SeedPhase]
                value.Watered = false -- 每次生长阶段变化时, 重置浇水状态

                print('Player ' .. value.Owner .. ', Field ' .. value.Id .. ', Seed: ' .. value.SeedType .. ' is growing, NextPhase: ' .. value.NextPhase)

                if isFruited(value) then
                    print('Player ' .. value.Owner .. ', Field ' .. value.Id .. ', Seed: ' .. value.SeedType .. ' is fruited, key: ' .. key)

                    -- 确定果实数量
                    value.FruitAmount = getRandomFruitAmount(value)

                    -- 移除已结果实的田地
                    PlantingFields[key] = nil
                end
            end
        end
    end
)

-- 更改农场名称
Handlers.add(
    "changeName",
    Handlers.utils.hasMatchingTag("Action", "ChangeName"),
    function(msg)
        -- print('msg: ' .. json.encode(msg))
        print('Player ' .. msg.From .. ' Change farm name, New: ' .. (msg.Tags['Name'] or '') 
            .. ', Twitter: ' .. (msg.Tags['Twitter'] or '')   .. ', Timestamp: ' .. msg.Timestamp)
        
        FarmNames[msg.From] = FarmNames[msg.From] or ''
        FarmNames[msg.From] = msg.Tags['Name']

        if msg.Tags['Twitter'] then
            FarmTwitters[msg.From] = FarmTwitters[msg.From] or ''
            FarmTwitters[msg.From] = msg.Tags['Twitter']
        end

        msg.reply({ Data = response.getSuccessResponse('success') })
    end
)

-- 设置农场公告
Handlers.add(
    "setNotice",
    Handlers.utils.hasMatchingTag("Action", "SetNotice"),
    function(msg)
        print('Set farm notice, Old: ' .. (FarmNotices[msg.From] or '') .. ', New: ' .. msg.Tags['Notice'] .. ', Timestamp: ' .. msg.Timestamp)

        FarmNotices[msg.From] = msg.Tags['Notice']

        msg.reply({ Data = response.getSuccessResponse('success') })
    end
)

-- 设置守卫
Handlers.add(
    "guard",
    Handlers.utils.hasMatchingTag("Action", "Guard"),
    function(msg)
        print('Guard, Player: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)

        -- 检测是否狗狗, 如果有则设置守卫
        for _, value in ipairs(Inventories[msg.From]) do
            if value.Category == global.InventoryCategory.ANIMAL and value.SubCategory == global.AnimalType.DOG then
                Guardeds[msg.From] = true
                msg.reply({ Data = response.getSuccessResponse('Guard success') })
                return
            end
        end

        msg.reply({ Data = response.getFailureResponse('Dog not found') })
    end
)

-- 领取狗狗
Handlers.add(
    "freegetDog",
    Handlers.utils.hasMatchingTag("Action", "FreegetDog"),
    function(msg)
        print('Freeget dog, Player: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)

        -- 检测是否赠送狗狗
        if not EnabledFreegetDog then
            msg.reply({ Data = response.getFailureResponse('Freeget dog not enabled') })
            return
        end

        Inventories[msg.From] = Inventories[msg.From] or {}

        -- 检测是否已经领取
        for _, value in ipairs(Inventories[msg.From]) do
            if value.Category == global.InventoryCategory.ANIMAL and value.SubCategory == global.AnimalType.DOG then
                msg.reply({ Data = response.getFailureResponse('Dog already received') })
                break
            end
        end

        -- 领取狗狗
        Inventories[msg.From][#Inventories[msg.From]+1] = {
            Category = global.InventoryCategory.ANIMAL,
            SubCategory = global.AnimalType.DOG,
            Amount = 1
        }

        -- 设置守卫
        Guardeds[msg.From] = true

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse('Dog received') })
    end
)

-- 随机获取农场
Handlers.add(
    "randomFarm",
    Handlers.utils.hasMatchingTag("Action", "RandomFarm"),
    function(msg)
        print('Random farm, Player: ' .. msg.From .. ', Current: ' .. (msg.Tags['Player'] or '') .. ', Timestamp: ' .. msg.Timestamp)

        -- 排除玩家
        local excludedPlayers = {}
        excludedPlayers[msg.From] = true

        if msg.Tags['Player'] then
            excludedPlayers[msg.Tags['Player']] = true
        end

        -- 随机获取玩家
        local player = getRandomPlayer(excludedPlayers)

        -- 获取农场信息
        local farmInfo = getFarmInfo(player)

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(farmInfo) })
    end
)

-- 是否赠送狗狗
Handlers.add(
    "canFreegetDog",
    Handlers.utils.hasMatchingTag("Action", "CanFreegetDog"),
    function(msg)
        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(EnabledFreegetDog) })
    end
)

-- 关注农场
Handlers.add(
    "follow",
    Handlers.utils.hasMatchingTag("Action", "Follow"),
    function(msg)
        print('Follow farm, Player: ' .. msg.From .. ' follow ' .. msg.Tags['FollowPlayer'] .. ', Timestamp: ' .. msg.Timestamp)

        -- 要关注的玩家
        local followPlayer = msg.Tags['FollowPlayer']

        -- 不能关注自己
        if followPlayer == msg.From then
            msg.reply({ Data = response.getFailureResponse('Cannot follow yourself') })
            return
        end

        -- 检测是否已关注
        for _, value in ipairs(Following[msg.From] or {}) do
            if value == followPlayer then
                msg.reply({ Data = response.getFailureResponse('Player already followed') })
                return
            end
        end

        -- 添加关注
        Following[msg.From] = Following[msg.From] or {}
        Following[msg.From][#Following[msg.From]+1] = followPlayer

        -- 添加关注者
        Followers[followPlayer] = Followers[followPlayer] or {}
        Followers[followPlayer][#Followers[followPlayer]+1] = msg.From

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(Following[msg.From]) })
    end
)

-- 取消关注
Handlers.add(
    "unfollow",
    Handlers.utils.hasMatchingTag("Action", "Unfollow"),
    function(msg)
        print('Unfollow farm, Player: ' .. msg.From .. ' unfollow ' .. msg.Tags['FollowPlayer'] .. ', Timestamp: ' .. msg.Timestamp)

        -- 要取消关注的玩家
        local followPlayer = msg.Tags['FollowPlayer']

        -- 不能取消关注自己
        if followPlayer == msg.From then
            msg.reply({ Data = response.getFailureResponse('Cannot unfollow yourself') })
            return
        end

        -- 检测是否已关注
        local index = 0
        for idx, value in ipairs(Following[msg.From] or {}) do
            if value == followPlayer then
                index = idx
                break
            end
        end

        if index > 0 then
            table.remove(Following[msg.From], index)
        else
            msg.reply({ Data = response.getFailureResponse('Player not followed') })
            return
        end

        -- 移除关注者
        local idx = 0
        for i, value in ipairs(Followers[followPlayer] or {}) do
            if value == msg.From then
                idx = i
                break
            end
        end

        if idx > 0 then
            table.remove(Followers[followPlayer], idx)
        end

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(Following[msg.From]) })
    end
)

-- 关注列表
Handlers.add(
    "getFollowing",
    Handlers.utils.hasMatchingTag("Action", "GetFollowing"),
    function(msg)
        local player = msg.Tags['Player'] or msg.From

        -- 获取已关注农场信息
        local farmInfos = {}

        for _, value in ipairs(Following[player] or {}) do
            farmInfos[#farmInfos+1] = getFarmBrief(value)
        end

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(farmInfos) })
    end
)

-- 关注者列表
Handlers.add(
    "getFollowers",
    Handlers.utils.hasMatchingTag("Action", "GetFollowers"),
    function(msg)
        local player = msg.Tags['Player'] or msg.From

        -- 获取关注者农场信息
        local farmInfos = {}

        for _, value in ipairs(Followers[player] or {}) do
            farmInfos[#farmInfos+1] = getFarmBrief(value)
        end

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(farmInfos) })
    end
)

-- 获取推荐农场
Handlers.add(
    "getRecommendFarms",
    Handlers.utils.hasMatchingTag("Action", "GetRecommendFarms"),
    function(msg)
        print('Get recommend farm, Player: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)

        -- 系统推荐农场
        local recommendFarms = {}

        -- 获取所有农场玩家
        local players = {}
        for key, _ in pairs(FarmNames) do
            if key ~= msg.From then
                -- 不推荐自己
                players[#players+1] = key 
            end
        end

        -- 不超过总农场数
        if TotalFarm > RecommendFarmCount then
            -- 随机排序玩家
            players = shuffle(players)

            -- 获取推荐农场
            for i = 1, RecommendFarmCount do
                recommendFarms[#recommendFarms+1] = getFarmBrief(players[i])
            end
        else
            -- 获取所有农场
            for _, player in ipairs(players) do
                recommendFarms[#recommendFarms+1] = getFarmBrief(player)
            end
        end

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse(recommendFarms) })
    end
)

-- 浇水
Handlers.add(
    "water",
    Handlers.utils.hasMatchingTag("Action", "Water"),
    function(msg)
        print('Water, Player: ' .. msg.From .. ', FieldId: ' .. (msg.Tags['FieldId'] or '0') 
               .. ', FieldOwner: ' .. (msg.Tags['FieldOwner'] or '') .. ', Timestamp: ' .. msg.Timestamp)

        -- 地块ID
        local fieldId = tonumber(msg.Tags['FieldId'])
        if not fieldId or fieldId <= 0 then
            msg.reply({ Data = response.getFailureResponse('FieldId is invalid') })
            return
        end

        -- 地块拥有者
        local owner = msg.Tags['FieldOwner'] or msg.From

        -- 查找田地
        local field = nil
        for _, value in ipairs(Fields[owner]) do
            if value.Id == fieldId then
                field = value
                break
            end
        end

        if field == nil then
            msg.reply({ Data = response.getFailureResponse('Field not found') })
            return
        end

        -- 检查田地拥有者
        -- if field.Owner ~= msg.From then
        --     msg.reply({ Data = response.getFailureResponse('Field not belong to player') })
        --     return
        -- end

        -- 检查田地是否已经种植
        if not field.Planting then
            msg.reply({ Data = response.getFailureResponse('Field not planted') })
            return
        end

        -- 检查是否已经成熟
        if isFruited(field) then
            msg.reply({ Data = response.getFailureResponse('Field is fruited') })
            return
        end

        -- 检查是否已经浇水
        if field.Watered then
            msg.reply({ Data = response.getFailureResponse('Field already watered') })
            return
        end

        -- 增加浇水次数
        field.WateredTimes = field.WateredTimes + 1
        field.Watered = true

        -- 农场日志
        FarmLogs[owner] = FarmLogs[owner] or {}
        FarmLogs[owner][#FarmLogs+1] = {
            FieldId = fieldId,
            SeedType = field.SeedType,
            CreatedTime = msg.Timestamp,
            Owner = owner,
            Player = msg.From,
            Action = 'Water',
            Description = 'Player ' .. msg.From .. ' has watered field ' .. fieldId
        }

        notify('Watered', {
            Player = msg.From,
            FieldId = fieldId,
            Owner = owner,
            SeedType = field.SeedType,
            Time = msg.Timestamp,
        })

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse('Water success') })
    end
)