-- import module
local json = require('json')
local bint = require('.bint')(256)

local request = require('lib.request')
local response = require('lib.response')
local global = require('global')


-- 全局变量

-- 日志
Logs = Logs or {}

-- 事件订阅者
Listeners = Listeners or {}

LisenterProcesses = { global.ProcessID.User, global.ProcessID.Farm }

-- 订单
Orders = Orders or {}

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

    print('Process init success')
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

-- Handlers
-- Ping
Handlers.add(
    'ping', 
    Handlers.utils.hasMatchingTag('Action', 'Ping'),
    function(msg) 
        msg.reply({ Data = 'Pong'})
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