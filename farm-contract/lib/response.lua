local json = require('json')

local response = {}

response.Response = { 
    Code = 0,
    Message = "Success",
    Data = {}
}

Code = {
    Success = 0,
    Failure = 1
}

function response.getResponse(code, message, data)
    return {
        Code = code,
        Message = message,
        Data = data
    }
end

function response.getSuccessResponse(data)
    return response.getResponse(Code.Success, 'Success', data)
end

function response.getErrorResponse(code, message)
    return response.getResponse(code, message, {})
end

function response.getFailureResponse(message)
    return response.getResponse(Code.Failure, message, {})
end

return response