local json = require "json"
local global = {}

-- 种子类别
global.SeedType = {
    APPLE = 'Apple',
    BANANA = 'Banana',
    GRAPE = 'Grape',
    ORANGE = 'Orange',
    PEAR = 'Pear',
    WATERMELON = 'Watermelon',
}

-- 种子阶段, seed -> burgeon -> grow -> bloom -> fruit
global.SeedPhase = {
    SEED = 'Seed', -- 种子
    BURGEON = 'Burgeon', -- 嫩芽
    GROWTH = 'Growth', -- 成长
    BLOOM = 'Bloom', -- 开花
    FRUIT = 'Fruit', -- 结果
}

-- 进程ID
global.ProcessID = {
    Token = 'GcwzadH0cQ7qjXEg3M5HcFMxcy_WKGijX1_PNxeHkT0',

    Farm = 'P1rdUpb2eh7WSU0T_--jkEdIYn4YQHpyP9f1Ti1L4oM',
    Store = 'gXO8dCcEAbsi08KNdAU4d3CbGfM7gZf0WnrFgg6P-1Y',
    User = 'o-ECKBY-tD78kfNbiQVWRAEUucWMmJoGkIlf0dmJM7o',

    -- Farm = 'qQGJC-a4VuGEajyY_cI5wV6xPo04cAEVTl_rxDxZpmg',
    -- Store = '8CBuu1VU2FEgIl8EB-1bDwXFtD6DlMjdllRYUAcqsNM',
    -- User = 'Fn3fuLunHd_xherwsUXhGY2BWXQr-OzNKqccN4IZGeg',
}

-- 免费赠送类别
global.FreegetCategory = {
    LOGIN = 'Login',
    INVITATION = 'Invitation',
    REGISTRATION = 'Registration',
}

-- 免费赠送类型
global.FreegetType = {
    CREDIT = 'Credit',
    SEED = 'Seed',
    TOKEN = 'Token',
}

-- 物品类别: 种子, 水果，动物
global.InventoryCategory = {
    SEED = 'Seed',
    FRUIT = 'Fruit',
    ANIMAL = 'Animal',
}

-- 动物类别
global.AnimalType = {
    DOG = 'Dog',
}

function PrintGlobal()
    print('global values: ' .. json.encode(global))
end

return global