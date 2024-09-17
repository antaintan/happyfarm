(function(){
    let self = {}
    window.data = self

    /** 是否为开发版 */
    self.isDev = window.parent.isDev
    /** 种子成熟需要的时间 */
    self.generationTime = self.isDev ? 12 : 1440
    
    /** 保存当前农场的信息 */
    self.curFarmInfo = null

    /** 我的邀请链接 */
    self.inviterUrl = ''
    /** 我的的钱包地址 */
    self.walletAddress = ''

    /** 我的农场进程ID */
    self.myFarmProcess

    /** 当前农场进程 */
    self.curFarmProcess
    /** 当前所在农场的玩家地址 */
    self.curPlayer = ''
    /** 当前农场的名称 */
    self.curFarmName = ''
    /** 当前农场绑定的推特帐号，用于跳到用户的推特页面 */
    self.curTwitterAccount = ''
    /** 当前农场的通知信息 */
    self.curNoticeContent = ''
    self.curDetailsUrl = ''
    

    /** 当前请求服务器的回调函数 */
    let curBackcall

    /** 我的关注列表 */
    let followingList
    let isOtherFollowing
    let isOtherFollowers

    /** 切换农场时清理 */
    self.clear = ()=>{
        isOtherFollowing = false
        isOtherFollowers = false
    }

    /** 判断是否在自己的农场内 */
    self.isSelf = ()=>{
        return self.walletAddress == self.curPlayer
    }

    /** 判断是否已经关注了指定的玩家 */
    self.isFollowing= player=>{
        //if(!followingList) return false
        let arr = followingList
        for(let i=0; i<arr.length; i++){
            if(arr[i].Player == player) return true
        }
        return false
    }

    self.getFollowing = (fun, isForce=false)=>{
        if(isForce == false && followingList){
            if(fun) fun(followingList)
            return followingList
        } 
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getFollowing'}, false)
    }
    self.getFollowingReply = (obj)=>{
        followingList = obj
        if(curBackcall){
            curBackcall(obj)
            curBackcall = null
        }
    }

    self.getFollowers = (fun)=>{
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getFollowers'})
    }
    self.getFollowersReply = (obj)=>{
        if(curBackcall) curBackcall(obj)
        curBackcall = null
    }

    self.getInvitation = (fun)=>{
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getInvitation'})
    }
    self.getInvitationReply = (obj)=>{
        if(curBackcall) curBackcall(obj)
        curBackcall = null
    }

    self.getRecommendFarms = (fun)=>{
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getRecommendFarms'})
    }
    self.getRecommendFarmsReply = (obj)=>{
        if(curBackcall) curBackcall(obj)
        curBackcall = null
    }

    self.getOtherFollowing = (fun)=>{
        if(isOtherFollowing) return isOtherFollowing
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getOtherFollowing', player:self.curPlayer})
    }
    self.getOtherFollowingReply = (obj)=>{
        isOtherFollowing = true
        if(curBackcall) curBackcall(obj)
        curBackcall = null
    }

    self.getOtherFollowers = (fun)=>{
        if(isOtherFollowers) return isOtherFollowers
        curBackcall = fun
        window.utils.sendMsgToParent({oper:'getOtherFollowers', player:self.curPlayer})
    }
    self.getOtherFollowersReply = (obj)=>{
        isOtherFollowers = true
        if(curBackcall) curBackcall(obj)
        curBackcall = null
    }



    let myInfo
    /** 获取个人信息对象 */
    self.getMyInfo = ()=>{
        if(!myInfo){
            myInfo = {
                info:{
                    points:2389,
                    coin:9527,
                    asset:56367,
                    level:'plutocrat',
                    debt:356936,
                    credit:80,
                    experience:100,
                    birthday:'10/08/2024',
                    assetList:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                    ],
                    farmingList:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3}
                    ],
                    decorationList:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3}
                    ]
                },
                swap:{
                    sell:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                    ],
                    purchase:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3}
                    ],
                    selled:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                    ],
                    purchased:[
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3},
                        {thumb:'home', name:'game coin', amount:3}
                    ]
                },
                currency:{
                    lend:[
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                    ],
                    borrow:[
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3}
                    ],
                    lending:[
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3},
                    ],
                    borrowing:[
                        {amount:3},
                        {amount:3},
                        {amount:3},
                        {amount:3}
                    ]
                }
            }
        }
        return myInfo
    }
})()