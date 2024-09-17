-- import module
local json = require('json')
local bint = require('.bint')(256)

local response = require('lib.response')
local global = require('global')

-- 当前模块
local M = {}

-- 全局变量

-- 事件订阅者
Listeners = Listeners or {}

-- 侦听进程
LisenterProcesses = { global.ProcessID.Farm, global.ProcessID.Store }

-- 用户列表
Users = Users or {}

-- 用户余额
Balances = Balances or {}

-- 用户积分
Credits = Credits or {}

-- 是否赠送积分
EnabledFreegetCredit = true

-- 免费赠送积分数量
FreegetCreditAmount = 100

-- 邀请赠送积分
FreegetCreditInviterAmount = 100

-- 邀请赠送代币
FreegetTokenInviterAmount = '100000000000000'

-- 交互赠送积分
ActionCreditAmount = 100

-- 是否赠送代币
EnabledFreegetToken = true

-- 免费赠送代币数量, 100 token
FreegetTokenAmount = '100000000000000'

-- 免费赠送记录
Freegets = Freegets or {}

-- 邀请列表
Inviters = Inviters or {}

-- 合约余额
ProcessTokenBalance = ProcessTokenBalance or '0'

-- 总用户数
TotalUserCount = TotalUserCount or 0

-- 全局方法

-- 初始化
function Init()
    -- 侦听进程
    for key, value in pairs(LisenterProcesses) do
        ao.send({
            Target = value,
            Action = 'RegisterListener',
            Module = 'User',
        })  
    end

    print('User process init success')
end

-- 获取用户信息
local function getUserInfo(player)
    local userInfo = {
        RegisteredTime = Users[player] or 0,
        Credits = Credits[player] or 0,
        Balance = Balances[player] or '0',
        Inviter = Inviters[player] or '',
        Invitation = Inviters[player] or {}
    }

    return userInfo
end

-- 获取代币
local function transferToken(process, recipient, amount)
    ao.send({
        Target = process,
        Action = "Transfer",
        Recipient = recipient,
        Quantity = amount
    })
end

-- 赎回代币
function RedeemToken(recipient, amount)
    transferToken(global.ProcessID.Token, recipient, amount) 
end

function GetUserInfo(player)
    return getUserInfo(player)
end

function SetBalance(player, balance)
    Balances[player] = balance
end

-- 取消所有侦听
function RemoveAllListener() 
    for key, value in pairs(LisenterProcesses) do
        ao.send({
            Target = value,
            Action = 'RemoveListener',
            Module = 'User',
        })  
    end
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

-- 用户登录, 自动注册
Handlers.add(
    "login",
    Handlers.utils.hasMatchingTag("Action", "Login"),
    function (msg)
        print('Request login, player: ' .. msg.From .. ', Inviter: ' .. (msg.Tags['Inviter'] or '') .. ', Timestamp: ' .. msg.Timestamp)

        -- 是否已注册
        if not Users[msg.From] then
            -- 第一次注册时间
            Users[msg.From] = msg.Timestamp
            TotalUserCount = TotalUserCount + 1

            print('New player register, player: ' .. msg.From .. ', TotalUserCount: ' .. TotalUserCount .. ', Timestamp: ' .. msg.Timestamp)

            Freegets[msg.From] = Freegets[msg.From] or {}

            -- 赠送积分, 只赠送一次
            if EnabledFreegetCredit and FreegetCreditAmount > 0 then
                Freegets[msg.From] = Freegets[msg.From] or {}
                
                local freegetCredit = nil
                for index, value in ipairs(Freegets[msg.From]) do
                    if value.Category == global.FreegetCategory.REGISTRATION and value.Type == global.FreegetType.CREDIT then
                        freegetCredit = value
                        break
                    end
                end

                if freegetCredit == nil then
                    -- 增加赠送记录        
                    Freegets[msg.From][#Freegets[msg.From]+1] = {
                        Category = global.FreegetCategory.REGISTRATION,
                        Type = global.FreegetType.CREDIT,
                        Amount = tostring(FreegetCreditAmount),
                        Timestamp = msg.Timestamp,
                    }
        
                    -- 增加积分
                    Credits[msg.From] = Credits[msg.From] or 0
                    Credits[msg.From] = Credits[msg.From] + FreegetCreditAmount
                    
                    print('Freeget credit amount: ' .. tostring(FreegetCreditAmount) .. ', Player: ' .. msg.From)    
                else
                    print('Freeget credit already received, Player: ' .. msg.From)                
                end    
            end

            -- 赠送代币, 只赠送一次
            if EnabledFreegetToken and bint.__lt(0, bint.fromstring(FreegetTokenAmount)) then
                local freegetToken = nil

                for index, value in ipairs(Freegets[msg.From]) do
                    if value.Category == global.FreegetCategory.REGISTRATION and value.Type == global.FreegetType.TOKEN then
                        freegetToken = value
                        break
                    end
                end

                if freegetToken == nil then
                    -- 增加赠送记录
                    Freegets[msg.From][#Freegets[msg.From]+1] = {
                        Category = global.FreegetCategory.REGISTRATION,
                        Type = global.FreegetType.TOKEN,
                        Amount = FreegetTokenAmount,
                        Timestamp = msg.Timestamp,
                    }

                    -- 增加代币
                    Balances[msg.From] = Balances[msg.From] or '0'
                    Balances[msg.From] = tostring(bint.__add(bint.fromstring(Balances[msg.From]), bint.fromstring(FreegetTokenAmount)))

                    print('Freeget token amount: ' .. FreegetTokenAmount .. ', Player: ' .. msg.From)
                else
                    print('Freeget token already received, Player: ' .. msg.From)
                end
            end

            -- 绑定邀请者
            local inviter = msg.Tags['Inviter'] or ''
            if inviter and inviter ~= '' then
                -- 检测邀请者是否存在
                if not Users[inviter] then
                    -- msg.reply({ Data = response.getErrorResponse('Inviter not found')})
                    print('Inviter ' .. inviter ' not found, can not bind inviter')
                    return
                end

                -- 添加至邀请者列表
                Inviters[inviter] = Inviters[inviter] or {}
                table.insert(Inviters[inviter], msg.From)
                print('Player ' .. msg.From .. ' bind inviter ' .. inviter)

                -- 赠送邀请者积分
                if FreegetCreditInviterAmount > 0 then
                    Credits[inviter] = (Credits[inviter] or 0) + FreegetCreditInviterAmount
                
                    Freegets[inviter][#Freegets[inviter]+1] = {
                        Category = global.FreegetCategory.INVITATION,
                        Type = global.FreegetType.CREDIT,
                        Amount = FreegetCreditInviterAmount,
                        Timestamp = msg.Timestamp,
                    }
    
                    print('Freeget credit amount: ' .. FreegetCreditInviterAmount .. ', Player: ' .. msg.From .. ', Inviter: ' .. inviter)    
                end
                
                -- 赠送邀请者代币
                if bint.__lt(0, bint.fromstring(FreegetTokenInviterAmount)) then
                    Balances[inviter] = Balances[inviter] or '0'
                    Balances[inviter] = tostring(bint.__add(bint.fromstring(Balances[inviter]), bint.fromstring(FreegetTokenInviterAmount)))

                    Freegets[inviter][#Freegets[inviter]+1] = {
                        Category = global.FreegetCategory.INVITATION,
                        Type = global.FreegetType.TOKEN,
                        Amount = FreegetTokenInviterAmount,
                        Timestamp = msg.Timestamp,
                        Player = msg.From,
                    }
    
                    print('Freeget token amount: ' .. FreegetTokenInviterAmount .. ', Player: ' .. msg.From .. ', Inviter: ' .. inviter)    
                end
            end
        
            -- 发送通知
            notify('NewPlayerRegistered', msg.From)
        end

        -- 用户信息
        local userInfo = getUserInfo(msg.From)

        msg.reply({ Data = response.getSuccessResponse(userInfo)})

        print('Player ' .. msg.From .. ' login success, Timestamp: ' .. msg.Timestamp)
    end
)

-- 获取用户信息
Handlers.add(
    'getUserInfo', 
    Handlers.utils.hasMatchingTag('Action', 'GetUserInfo'),
    function(msg) 
        print('Get user info, Player: ' .. (msg.Tags['Player'] or '') .. ', From: ' .. msg.From)

        local player = msg.Tags['Player'] or msg.From
        local userInfo = getUserInfo(player)

        msg.reply({ Data = response.getSuccessResponse(userInfo) })
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


-- 处理通知
Handlers.add(
  "handleNotify",
  Handlers.utils.hasMatchingTag("Action", "Notify"),
  function (msg)
    -- 农场模块
    if msg.From == global.ProcessID.Farm then
        print('Notify from Farm Process: ' .. msg.From .. ", Event: " .. msg.Event .. ', Data: ' .. json.encode(msg.Data))
        if msg.Event == 'Planted' then
            local eventData = msg.Data
            print("New field plant, Event data: " .. json.encode(eventData) .. ', timestamp: ' .. msg.Timestamp)

            -- 赠送积分
            Credits[eventData.Player] = Credits[eventData.Player] + ActionCreditAmount
        elseif msg.Event == 'Harvested' then
            local eventData = msg.Data
            print("Field harvested, Event data: " .. json.encode(eventData) .. ', timestamp: ' .. msg.Timestamp)

            -- 赠送积分
            Credits[eventData.Player] = Credits[eventData.Player] + ActionCreditAmount
        elseif msg.Event == "SellDeductSuccess" then
            local eventData = msg.Data
            print("Sell deduct success, Event data: " .. json.encode(eventData) .. ', timestamp: ' .. msg.Timestamp)

            -- 增加用户余额
            Balances[eventData.Player] = Balances[eventData.Player] or '0'
            Balances[eventData.Player] = tostring(bint.__add(bint.fromstring(Balances[eventData.Player]), bint.fromstring(eventData.TotalPrice)))

            -- 赠送积分
            Credits[eventData.Player] = Credits[eventData.Player] + ActionCreditAmount

            -- 返回消息处理成功
            msg.reply({ Data = 'SellDeductSuccess hanlde success, player balance: ' .. Balances[eventData.Player] })
        elseif msg.Event == 'Watered' then
            local eventData = msg.Data
            print('Player ' .. eventData.Player .. ' watered for field, FieldId: ' .. eventData.FieldId .. ', FieldOwner: ' .. eventData.Owner)

            -- 浇水一次奖励积分
            Credits[eventData.Player] = Credits[eventData.Player] + ActionCreditAmount
        else
            print("From Farm module notify, unhandle event: " .. msg.Event)
        end
    end

    -- 商店模块
    if msg.From == global.ProcessID.Store then
        print('Notify from Store Process: ' .. msg.From .. ", Event: " .. msg.Event .. ', Data: ' .. json.encode(msg.Data))
        if msg.Event == "Buy" then
            local eventData = msg.Data
            print("Buy event, Event data: " .. json.encode(eventData) .. ', timestamp: ' .. msg.Timestamp)

            -- 检测用户余额
            if bint.__lt(bint.fromstring(Balances[eventData.Player]), bint.fromstring(eventData.TotalPrice)) then
                print('Player balance not enough, balance: ' .. Balances[eventData.Player] .. ', BuyAmount: ' .. eventData.TotalPrice)
                notify('BuyDeductFailure', eventData)
                return
            end

            -- 扣除用户余额
            Balances[eventData.Player] = tostring(bint.__sub(bint.fromstring(Balances[eventData.Player]), bint.fromstring(eventData.TotalPrice)))

            -- 赠送积分
            Credits[eventData.Player] = Credits[eventData.Player] + ActionCreditAmount

            print('Player ' .. eventData.Player .. ' buy deduct success, eventData: ' .. json.encode(eventData))
            notify('BuyDeductSuccess', eventData)
        else
            print("From Store module notify, unhandle event: " .. msg.Event)
        end
    end
  end
)


-- 充值
Handlers.add(
    "creditNotice",
    Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'),
    function(msg)
        print('creditNotice, from: ' .. msg.From .. ' sender: ' .. msg.Tags["Sender"] .. ' quantity: ' .. msg.Tags["Quantity"])

        -- 检查是否为代币充值
        if msg.From ~= global.ProcessID.Token then
            msg.reply({ Data = 'Invalid credit notice' })
            return
        end

        -- 读取数据
        local sender = msg.Tags["Sender"]
        local quantity = bint.fromstring(msg.Tags["Quantity"])

        -- 更新余额
        Balances[sender] = Balances[sender] or '0'
        Balances[sender] = tostring(bint.__add(bint.fromstring(Balances[sender]), quantity))

        -- 更新合约余额
        ProcessTokenBalance = tostring(bint.__add(bint.fromstring(ProcessTokenBalance), quantity))
    end
)

-- 提现
Handlers.add(
    "withdraw",
    Handlers.utils.hasMatchingTag('Action', 'Withdraw'),
    function(msg)
        print('Player ' .. msg.From .. ' withdraw, Recipient: ' .. msg.From .. ', Amount: ' .. msg.Tags["Amount"] .. ', Balance: ' .. Balances[msg.From])

        local amount = bint.fromstring(msg.Tags["Amount"]) or bint.zero()

        -- 检查提现数量
        if bint.__lt(amount, 0) then
            msg.reply({ Data = response.getFailureResponse('Invalid amount') })
            return
        end

        -- 检查用户余额
        local balance = bint.fromstring(Balances[msg.From] or '0')

        if bint.__lt(balance, amount) then
            print('Player ' .. msg.From .. ' withdraw ' .. tostring(amount) .. ', balance: ' .. Balances[msg.From] .. ', Insufficient Balance')
            msg.reply({ Data = response.getFailureResponse('Insufficient Balance') })
            return
        end

        -- 检查合约余额
        if bint.__lt(bint.fromstring(ProcessTokenBalance), amount) then
            print('Process insufficient Balance, Process balance: ' .. ProcessTokenBalance)
            msg.reply({ Data = response.getFailureResponse('Process insufficient Balance') })
            return
        end

        -- 更新余额
        Balances[msg.From] = tostring(bint.__sub(balance, amount))
        ProcessTokenBalance = tostring(bint.__sub(ProcessTokenBalance, amount))

        -- 转移代币
        transferToken(global.ProcessID.Token, msg.From, tostring(amount))

        -- 返回结果
        msg.reply({ Data = response.getSuccessResponse('Withdraw success') })
    end
)

-- 提现通知
Handlers.add(
    "debitNotice",
    Handlers.utils.hasMatchingTag('Action', 'Debit-Notice'),
    function(msg)
        print('Debit Notice, from: ' .. msg.From .. ', data: ' .. msg.Data)
        if msg.From == global.ProcessID.Token then
            print('Withdraw success, TokenProcess: ' .. global.ProcessID.Token .. ', Recipient: ' .. msg.Recipient
                .. ', Quantity: ' .. msg.Quantity)
        end
    end
)

-- 我的邀请列表
Handlers.add(
    "invitation",
    Handlers.utils.hasMatchingTag('Action', 'Invitation'),
    function(msg)
        print('Get player invitation, player: ' .. msg.From .. ', timestamp: ' .. msg.Timestamp)
        
        Inviters[msg.From] = Inviters[msg.From] or {}

        msg.reply({ Data = response.getSuccessResponse(Inviters[msg.From]) })
    end
)