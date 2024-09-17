local ao = require('.ao')
local json = require('json')

local request = {}

function request.send(processId, action, tags)
    local message = {
        Target = processId,
        Action = action,
    }

    if tags then
        for k, v in pairs(tags) do
            message[k] = v
        end
    end

    local result = ao.send(message).receive().Data

    return result
end

return request