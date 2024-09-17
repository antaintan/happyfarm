-- import module
local json = require('json')
local bint = require('.bint')(256)

local request = require('lib.request')
local response = require('lib.response')
local global = require('global')

-- 全局变量
TokenDecimals = 12

-- 日志
Logs = Logs or {}

-- 价格
Prices = Prices or {}

-- 事件订阅者
Listeners = Listeners or {}

LisenterProcesses = { global.ProcessID.User, global.ProcessID.Farm }

-- 初始化
function Init()
    -- 侦听进程
    for key, value in pairs(LisenterProcesses) do
        ao.send({
            Target = value,
            Action = 'RegisterListener',
            Module = 'Store',
        })  
    end

    -- 初始化价格
    Prices[global.InventoryCategory.FRUIT] = '3000000000000'
    Prices[global.InventoryCategory.SEED] = '10000000000000'
    Prices[global.InventoryCategory.ANIMAL .. '-' .. global.AnimalType.DOG] = '10000000000000'

    print('Store process init success')
end

-- 取消所有侦听
function RemoveAllListener() 
    -- 取消农场模块侦听
    ao.send({
        Target = global.ProcessID.Farm,
        Action = 'RemoveListener',
        Module = 'User',
    })
end

-- 广播事件
local function notify(event, data)
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

-- Action

-- Ping
Handlers.add(
    'ping', 
    Handlers.utils.hasMatchingTag('Action', 'Ping'),
    function(msg) 
        msg.reply({ Data = 'Pong'})
    end
)

-- 获取价格
Handlers.add(
    'getPrices', 
    Handlers.utils.hasMatchingTag('Action', 'GetPrices'),
    function(msg) 
        msg.reply({ Data = response.getSuccessResponse(Prices) })
    end
)

-- 购买
Handlers.add(
    'buy', 
    Handlers.utils.hasMatchingTag('Action', 'Buy'),
    function(msg) 
        print('Buy request, Player: ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)

        -- -- 购买类别
        -- local category = msg.Tags['Category']
        -- if category ~= global.InventoryCategory.FRUIT or category ~= global.InventoryCategory.SEED then
        --     msg.reply({ Data = 'Invalid category'})
        --     return
        -- end

        -- 购买数量
        local amount = tonumber(msg.Tags['Amount'])
        if amount <= 0 then
            msg.reply({ Data = response.getFailureResponse('Invalid amount')})
            return
        end

        -- 用户信息
        -- local userInfo = request.send(global.ProcessID.User, 'GetUserInfo', { Player = msg.From }).Data
        -- print('Query user info from user process: ' .. global.ProcessID.User .. ', Player info: ' .. json.encode(userInfo))

        -- if userInfo == nil then
        --     msg.reply({ Data = response.getFailureResponse('User not found')})
        --     return
        -- end
        
        -- 检查用户余额
        local totalPrice = bint.__mul(bint.fromstring(Prices[global.InventoryCategory.SEED]), amount)
        -- if bint.__lt(bint.fromstring(userInfo.Balance), totalPrice) then
        --     msg.reply({ Data = response.getFailureResponse('Insufficient balance')})
        --     return
        -- end

        msg.reply({ Data = response.getSuccessResponse('Buy request success')})

        print('Player ' .. msg.From .. ' buy, Category: Seed, Amount: ' .. amount .. ', Price: ' .. Prices[global.InventoryCategory.SEED])

        -- 购买通知
        notify('Buy', {
            Player = msg.From,
            Category = global.InventoryCategory.SEED,
            SubCategory = global.SeedType.APPLE,
            Amount = amount,
            Price = Prices[global.InventoryCategory.SEED],
            TotalPrice = tostring(totalPrice)
        })
    end
)

-- 出售
Handlers.add(
    'sell', 
    Handlers.utils.hasMatchingTag('Action', 'Sell'),
    function(msg) 
        print('Player ' .. msg.From .. ', sell fruit amount ' .. msg.Tags['Amount'] .. ', Timestamp: ' .. msg.Timestamp)

        -- 检查数量
        local amount = tonumber(msg.Tags['Amount'])
        if not amount or amount <= 0 then
            msg.reply({ Data = response.getFailureResponse('Invalid amount')})
            return
        end

        -- 检查果实是否存在
        -- local inventory = request.send(
        --     global.ProcessID.Farm, 
        --     'GetInventory', 
        --     { 
        --         Player = msg.From, 
        --         Category = global.InventoryCategory.FRUIT,
        --         SubCategory = global.SeedType.APPLE
        --     }
        -- ).Data

        -- print('query farm, player: ' .. msg.From .. ', inventory: ' .. json.encode(inventory))

        -- if not inventory or not inventory.Amount or inventory.Amount < amount then
        --     msg.reply({ Data = response.getFailureResponse('Insufficient inventory') })
        --     return
        -- end

        -- 计算总价
        local totalPrice = tostring(bint.__mul(bint.fromstring(Prices[global.InventoryCategory.FRUIT]), amount))

        print('Player ' .. msg.From .. ', sell request, Category: Fruit, SubCategory: Apple'
            .. ', Amount: ' .. amount .. ', Price: ' .. Prices[global.InventoryCategory.FRUIT] .. ', TotalPrice: ' 
            .. totalPrice .. ', Timestamp: ' .. msg.Timestamp)

        -- 返回消息
        msg.reply({ Data = response.getSuccessResponse('Sell request success')})

        -- 出售通知
        notify('Sell', {
            Player = msg.From,
            Category = global.InventoryCategory.FRUIT,
            SubCategory = global.SeedType.APPLE,
            Amount = amount,
            Price = Prices[global.InventoryCategory.FRUIT],
            TotalPrice = totalPrice
        })
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

        print('Register listener, ' .. msg.From .. ', Timestamp: ' .. msg.Timestamp)
        msg.reply({ Data = 'Listener register success'})
    end
)

-- 移除侦听者
Handlers.add(
    'removeListener', 
    Handlers.utils.hasMatchingTag('Action', 'RemoveListener'),
    function(msg) 
        removeListener(msg.From)
        msg.reply({ Data = 'Listener remove success'})
    end
)


-- 购买狗狗
Handlers.add(
    'buyDog', 
    Handlers.utils.hasMatchingTag('Action', 'BuyDog'),
    function(msg) 
        local dogPrice = Prices[global.InventoryCategory.ANIMAL .. '-' .. global.AnimalType.DOG]

        print('Player ' .. msg.From .. ', Buy dog, dog price: ' .. dogPrice .. ', Timestamp: ' .. msg.Timestamp)

        -- 获取用户信息
        local userInfo = request.send(global.ProcessID.User, 'GetUserInfo', { Player = msg.From }).Data
        if userInfo == nil then
            msg.reply({ Data = response.getFailureResponse('User not found')})
            return
        end

        -- 检查用户余额
        if bint.__lt(bint.fromstring(userInfo.Balance), bint.fromstring(dogPrice)) then
            msg.reply({ Data = response.getFailureResponse('Balance Insufficient') })
            return
        end

        -- 返回消息
        msg.reply({ Data = response.getSuccessResponse('Buy dog request success')})

        -- 购买通知
        notify('Buy', {
            Player = msg.From,
            Category = global.InventoryCategory.ANIMAL,
            SubCategory = global.AnimalType.DOG,
            Amount = 1,
            Price = dogPrice,
            TotalPrice = dogPrice,
        })
    end
)