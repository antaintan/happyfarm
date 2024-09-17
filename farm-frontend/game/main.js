function mainScene(self){
    //当执行错误时
    let errBc = null
    //接收vue层传来的消息，一般是接收服务器请求的结果
    window.sendMsg = (obj)=>{
        console.log(obj)
        window.utils.hideLoading()
        //统一处理错误
        if(obj.code != 0){
            if(errBc) errBc()
            removeStartupAni()
            if(obj.msg == 'Please install arConnect'){
                root.visible = false
                window.utils.confirm('Arconnect is not installed, Do you want to install it?', ()=>{
                    window.open('https://www.arconnect.io/download', '_blank')
                }, stage)
            } 
            //window.utils.alert(obj.msg, !!window.data.curProcess)
            window.utils.alert(obj.msg)
            return;
        }
        errBc = null
        //根据不同的请求回调，执行不同的操作
        let oper = obj.data.oper
        if(oper == 'getWalletAddress'){
            getWalletAddressReplay(obj.data.addr)
        }else if(oper == 'login'){
            loginReply(obj.data.data)
        }else if(oper == 'getUserInfo'){
            getUserInfoReply(obj.data.data)
        }
        else if(oper == 'getInfoFromMainFarm'){
            console.log('oper= '+oper)
            //从主农场进程获取自己农场进程的ID
            getInfoFromMainFarmReplay(obj.data.data)
        }
        else if(oper == 'getFarmInfo' || oper == 'randomFarm'){
            getFarmInfoReply(obj.data.data)
        }else if(oper == 'plant'){
            plantReply(obj)
        }else if(oper == 'harvest'){
            harvestReply(obj.data.data)
        }else if(oper == 'getFields'){
            
        }else if(oper == 'buy' || oper == 'sell'){
            window.utils.sendMsgToParent({oper:'getUserInfo'}, false)
            let msg = oper == 'buy' ? 'Buy successful' : 'Sell successful'
            window.utils.tip(msg)
        }else if(oper == 'getPrices'){

        }else if(oper == 'withdraw'){
            withdrawReply()
        }else if(oper == 'recharge'){
            window.utils.tip('Deposit successful')
            setTimeout(()=>{ window.utils.sendMsgToParent({oper:'getUserInfo'}) }, 2000)
        }
        else if(oper == 'getFollowing'){
            window.data.getFollowingReply(obj.data.data)
        }else if(oper == 'getFollowers'){
            window.data.getFollowersReply(obj.data.data)
        }else if(oper == 'getInvitation'){
            window.data.getInvitationReply(obj.data.data)
        }
        else if(oper == 'getRecommendFarms'){
            window.data.getRecommendFarmsReply(obj.data.data)
        }
        else if(oper == 'getOtherFollowing'){
            window.data.getOtherFollowingReply(obj.data.data)
        }else if(oper == 'getOtherFollowers'){
            window.data.getOtherFollowersReply(obj.data.data)
        }else if(oper == 'water'){
            waterReply()
        }
        else if(oper == 'follow'){
            window.data.getFollowing(null, true)
            setFollowState(window.data.curPlayer)
            window.utils.tip('Follow Success')
        }else if(oper == 'unfollow'){
            window.data.getFollowing(null, true)
            setFollowState(window.data.curPlayer)
            window.utils.tip('Unfollow Success')
        }
        else if(oper == 'editFrameName'){
        }else if(oper == 'editNotice'){
        }
        else if(oper == 'freegetGetDog'){
            self.getDogBtn.visible = false
            self.dog.visible = true
        }
    }

    //----------------------------------右键菜单------------------------------
    let rightMenu
    function createRightMenu(){
        document.body.addEventListener('contextmenu', e=>{
            e.preventDefault();
            if(rightMenu) removeLightMenu()
            if(window.utils.hasPopupPanel()) return

            let px = e.clientX
            let py = e.clientY
            let tw, th
            if(window.utils.getScreenAdapt() == 1){
                let c = document.getElementById('canvas')
                let dx = (SW-c.width)/2
                let dy = (SH-c.height)/2
                let rx = c.width/CW
                let ry = c.height/CH
                px = (px-dx)/rx
                py = (py-dy)/ry
                tw = CW
                th = CH
            }else{
                tw = SW
                th = SH
            }
            
            rightMenu = window.utils.createMC('RightMenu')
            let w = rightMenu.nominalBounds.width
            let h = rightMenu.nominalBounds.height
            if(px+w > tw) px = px - w
            if(py+h > th) py = py - h
            rightMenu.x = px
            rightMenu.y = py
            stage.addChild(rightMenu)
            rightMenu.btn0.on('click', ()=>{
                createMyInfo()
            })
            rightMenu.btn1.on('click', ()=>{
                
            })
            rightMenu.btn2.on('click', ()=>{
                
            })
            document.body.addEventListener('click', removeLightMenu)
        })
    }
    function removeLightMenu(){
        stage.removeChild(rightMenu)
        rightMenu = null
        document.body.removeEventListener('click', removeLightMenu)
    }
    //createRightMenu()

    //---------------------------------创建我的信息------------------------------
    function createMyInfo(){
        let infoAssetPanel
        let infoFarmingPanel
        let infoDecorationPanel
        let swapSellPanel
        let swaPurchasePanel
        let swapSelledPanel
        let swaPurchasedPanel
        let currencyLendPanel
        let currencyBorrowPanel
        let currencyLendingPanel
        let currencyBorrowingPanel
        let myInfo = window.data.getMyInfo()
        let panel = window.utils.createMC('MyInfoPanel')
        window.utils.popupPanel(panel)
        panel.visible = false
        setTimeout(()=>{
            panel.visible = true
            window.utils.tabBar([panel.tab0, panel.tab1, panel.tab2], [panel.panel0, panel.panel1, panel.panel2], (e)=>{
                if(e.name == 'tab0'){
                }else if(e.name == 'tab1'){
                    if(!swapSellPanel) createSwapPanel(panel.panel1)
                }
                else if(e.name == 'tab2'){
                    if(!currencyLendPanel) createCurrencyPanel(panel.panel2)
                }
            })
            createInfoPanel(panel.panel0)
        }, 50)

        function createInfoPanel(mc){
            let info = myInfo.info
            mc.pointsTf.text = info.points
            mc.coinTf.text = info.coin
            mc.assetTf.text = info.asset
            mc.levelTf.text = info.level
            mc.debtTf.text = info.debt
            mc.creaditTf.text = info.credit
            mc.experienceTf.text = info.experience
            mc.birthdayTf.text = info.birthday
            window.utils.tabBar([mc.tab0, mc.tab1, mc.tab2], [mc.panel0, mc.panel1, mc.panel2], (e)=>{
                if(e.name == 'tab0'){
                    if(infoAssetPanel) return
                    mc.panel0.removeAllChildren()
                    let itemArr = handleData(info.assetList)
                    let uiCfg = {item:'MyInfoAssetItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    infoAssetPanel = window.utils.listPanel(mc.panel0, uiCfg, itemArr, 8, 10, cellClikHandler)
                }else if(e.name == 'tab1'){
                    if(infoFarmingPanel) return
                    mc.panel1.removeAllChildren()
                    let itemArr = handleData(info.farmingList)
                    let uiCfg = {item:'MyInfoFarmingItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    infoFarmingPanel = window.utils.listPanel(mc.panel1, uiCfg, itemArr, 8, 10, cellClikHandler)
                }else if(e.name == 'tab2'){
                    if(infoDecorationPanel) return
                    mc.panel2.removeAllChildren()
                    let itemArr = handleData(info.decorationList)
                    let uiCfg = {item:'MyInfoDecorationItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    infoDecorationPanel = window.utils.listPanel(mc.panel2, uiCfg, itemArr, 8, 10, cellClikHandler)
                }
            })
            function handleData(dataArr){
                let arr = []
                for(let i=0; i<dataArr.length; i++){
                    let obj = dataArr[i]
                    let nm = obj.name.substring(0, 16)
                    arr.push({index:i, nameTf:nm, amountTf:obj.amount})
                }
                return arr
            }
            function cellClikHandler(e){
                if(e.target == 'buy'){
                }else if(e.target == 'cancel'){
                }
            }
        }

        function createSwapPanel(mc){
            let swap = myInfo.swap
            window.utils.tabBar([mc.tab0, mc.tab1, mc.tab2, mc.tab3], [mc.panel0, mc.panel1, mc.panel2, mc.panel3], (e)=>{
                if(e.name == 'tab0'){
                    if(swapSellPanel) return
                    mc.panel0.removeAllChildren()
                    let itemArr = handleData(swap.sell)
                    let uiCfg = {item:'MySwapSellItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    swapSellPanel = window.utils.listPanel(mc.panel0, uiCfg, itemArr, 8, 10, cellClikHandler)
                }else if(e.name == 'tab1'){
                    if(swaPurchasePanel) return
                    mc.panel1.removeAllChildren()
                    let itemArr = handleData(swap.purchase)
                    let uiCfg = {item:'MySwapPurchaseItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    swaPurchasePanel = window.utils.listPanel(mc.panel1, uiCfg, itemArr, 8, 10, cellClikHandler)
                }else if(e.name == 'tab2'){
                    if(swapSelledPanel) return
                    mc.panel2.removeAllChildren()
                    let itemArr = handleData(swap.selled)
                    let uiCfg = {item:'MySwapSelledItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    swapSelledPanel = window.utils.listPanel(mc.panel2, uiCfg, itemArr, 8, 10, cellClikHandler)
                }else if(e.name == 'tab3'){
                    if(swaPurchasedPanel) return
                    mc.panel3.removeAllChildren()
                    let itemArr = handleData(swap.purchased)
                    let uiCfg = {item:'MySwapPurchasedItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    swaPurchasedPanel = window.utils.listPanel(mc.panel3, uiCfg, itemArr, 8, 10, cellClikHandler)
                }
            })
            function handleData(dataArr){
                let arr = []
                for(let i=0; i<dataArr.length; i++){
                    let obj = dataArr[i]
                    let nm = obj.name.substring(0, 16)
                    arr.push({index:i, nameTf:nm, amountTf:obj.amount})
                }
                return arr
            }
            function cellClikHandler(e){
                if(e.target == 'buy'){
                }else if(e.target == 'cancel'){
                }
            }
        }

        function createCurrencyPanel(mc){
            let currency = myInfo.currency
            window.utils.tabBar([mc.tab0, mc.tab1, mc.tab2, mc.tab3], [mc.panel0, mc.panel1, mc.panel2, mc.panel3], (e)=>{
                if(e.name == 'tab0'){
                    if(currencyLendPanel) return
                    mc.panel0.removeAllChildren()
                    let itemArr = handleData(currency.lend)
                    let uiCfg = {item:'MyCurrencyLendItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    currencyLendPanel = window.utils.listPanel(mc.panel0, uiCfg, itemArr, 9, 10, cellClikHandler, 0)
                }else if(e.name == 'tab1'){
                    if(currencyBorrowPanel) return
                    mc.panel1.removeAllChildren()
                    let itemArr = handleData(currency.borrow)
                    let uiCfg = {item:'MyCurrencyBorrowItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    currencyBorrowPanel = window.utils.listPanel(mc.panel1, uiCfg, itemArr, 9, 10, cellClikHandler, 0)
                }else if(e.name == 'tab2'){
                    if(currencyLendingPanel) return
                    mc.panel2.removeAllChildren()
                    let itemArr = handleData(currency.lending)
                    let uiCfg = {item:'MyCurrencyLendingItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    currencyLendingPanel = window.utils.listPanel(mc.panel2, uiCfg, itemArr, 9, 10, cellClikHandler, 0)
                }else if(e.name == 'tab3'){
                    if(currencyBorrowingPanel) return
                    mc.panel3.removeAllChildren()
                    let itemArr = handleData(currency.borrowing)
                    let uiCfg = {item:'MyCurrencyBorrowingItem', prev:'PrevPageBtn', turn:'PageNumber', next:'NextPageBtn'}
                    currencyBorrowingPanel = window.utils.listPanel(mc.panel3, uiCfg, itemArr, 9, 10, cellClikHandler, 0)
                }
            })
            function handleData(dataArr){
                let arr = []
                for(let i=0; i<dataArr.length; i++){
                    let obj = dataArr[i]
                    arr.push({index:i, amountTf:obj.amount})
                }
                return arr
            }
            function cellClikHandler(e){
                if(e.target == 'buy'){
                }else if(e.target == 'cancel'){
                }
            }
        }
    }

    
    //--------------------------------------狗----------------------------------
    function getDog(){
        let lib = AdobeAn.compositions['660BE5B75B54C24BBF1A55E89F61D75F'].getLibrary()
        let dog = new lib.Dog();
        dog.x = 39
        dog.y = 40
        self.dog.addChild(dog)
    }
    /** 狗叫 */
    function dogWoof(){
        playSound("dogSound")
    }
    
    
    //----------------------------------创建启动动画-----------------------------
    let startupPopupPanel
    function createStartupAni(){
        //先隐藏主界面，等初始化完成后再显示
        root.visible = false;
        let startup = window.utils.createMC('StartupView')
        startupPopupPanel = window.utils.popupPanel(startup,  -1, -1, -50, 0, null, '#000000', stage)
    }
    function removeStartupAni(){
        if(startupPopupPanel){
            startupPopupPanel.getContent().circle.ani.stop()
            startupPopupPanel.remove()
            startupPopupPanel = null
            root.visible = true
        }
    }
    createStartupAni()

    

    //-----------------------------------------初始化执行--------------------------------
    setTimeout(()=>{
        getDog()
        let adpat = window.utils.getScreenAdapt()
        if(!adpat || adpat == 0){
            matchScreen();
        } 
        window.utils.cacheMc(self.bg);
        let addr = window.parent.hasWalletAddress()
        if(addr){
            getWalletAddressReplay(addr)
        }else{
            //通知父级初始化完成，并执行用户登录
            window.utils.sendMsgToParent({oper:'getWalletAddress'}, false)
        }
        
        cash()
        otherFarm()
    }, 100)

    //----------------------------------------用户及登录-----------------------------------
    /** 初始化用户信息 */
    function getWalletAddressReplay(address){
        window.data.getFollowing()

        window.data.walletAddress = address
        window.data.curPlayer = address
        let  str = address.substring(0, 4)+'...'+address.substring(address.length-4)
        self.parent.userInfoBar.addrTf.text = str

        let recommend = self.parent.recommend
        let recommendPanel
        recommend.openBtn.on('click', ()=>{
            recommend.openBtn.visible = false
            createjs.Tween.get(recommend).to({x:0}, 300)
            if(recommendPanel) return
            createPanel()
        })
        recommend.closeBtn.on('click', ()=>{
            if(recommend.openBtn.visible == true) return
            createjs.Tween.get(recommend).to({x:-488}, 300).call(()=>{
                recommend.openBtn.visible = true
            })
        })
        recommend.refreshBtn.on('click', ()=>{ createPanel() })
        function createPanel(){
            recommend.panel0.removeAllChildren()
            window.data.getRecommendFarms((arr)=>{
                let itemArr = handleData(arr)
                let uiCfg = {item:'recommendPanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                recommendPanel = window.utils.listPanel(recommend.panel0, uiCfg, itemArr, 15, 8, cellClikHandler)
            })
            function handleData(dataArr){
                let arr = []
                for(let i=0; i<dataArr.length; i++){
                    let obj = dataArr[i]
                    let nm = obj.Name.substring(0, 15)
                    let address = obj.Player
                    let addr = address.substring(0,4)+'...'
                    arr.push({index:i, nameTf:nm, name:obj.Name, addrTf:addr, addr:obj.Player, visitTf:obj.VisitCount, gotoBtn:''})
                }
                return arr
            }
            function cellClikHandler(e){
                if(e.target == 'nameBtn'){
                    window.utils.copyToClipboard(e.data.name)
                    window.utils.tip('Copied')
                }else if(e.target == 'addrBtn'){
                    let url = window.location.origin+'?farm='+e.data.addr
                    window.utils.copyToClipboard(url)
                    window.utils.tip('Copied')
                }else if(e.target == 'gotoBtn'){
                    switchFarm(e.data.addr)
                }else if(e.target == 'visitBtn'){
                }
            }
        }


        let bar = self.parent.userInfoBar
        let listY = bar.list.y
        bar.list.y = -200
        window.utils.textToBtn(bar.addrTf, '#ffff00', '#5B2502', '#ffffff', ()=>{
            let url = window.data.walletAddress
            window.utils.copyToClipboard(url)
            window.utils.tip('copied')
        })

        bar.myInfoBtn.on('click', ()=>{
            let py = (bar.list.y == listY) ? -160 : listY
            createjs.Tween.get(bar.list).to({y:py}, 300)
        })
        
        bar.followBtn.on('click', ()=>{
            let x = self.parent.userInfoBar.x
            let y = self.parent.userInfoBar.y
            let mc = window.utils.createMC('FollowPanel');
            mc.visible = false
            let w = mc.nominalBounds.width
            let followPopup = window.utils.popupPanel(mc, x-w+20, y+25, 0, 0.3, ()=>{
                followPopup.remove()
            })
            setTimeout(()=>{
                let following
                let followers
                let invitation
                mc.visible = true
                window.utils.tabBar([mc.tab0, mc.tab1, mc.tab2], [mc.panel0, mc.panel1, mc.panel2], e=>{
                    if(e.name == 'tab0'){
                        mc.header.gotoAndStop(0)
                        if(following) return
                        mc.panel0.removeAllChildren()
                        window.data.getFollowing((arr)=>{
                            let itemArr = handleData(arr)
                            let uiCfg = {item:'followingPanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                            following = window.utils.listPanel(mc.panel0, uiCfg, itemArr, 15, 8, cellClikHandler)
                        })
                    }else if(e.name == 'tab1'){
                        mc.header.gotoAndStop(0)
                        if(followers) return
                        mc.panel1.removeAllChildren()
                        window.data.getFollowers((arr)=>{
                            let itemArr = handleData(arr)
                            let uiCfg = {item:'followersPanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                            followers = window.utils.listPanel(mc.panel1, uiCfg, itemArr, 15, 8, cellClikHandler)
                        })
                    }else if(e.name == 'tab2'){
                        mc.header.gotoAndStop(1)
                        if(invitation) return
                        mc.panel2.removeAllChildren()
                        window.data.getInvitation((arr)=>{
                            let itemArr = handleData1(arr)
                            let uiCfg = {item:'invitePanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                            invitation = window.utils.listPanel(mc.panel2, uiCfg, itemArr, 15, 8, cellClikHandler)
                        })
                    }
                })
                function handleData(dataArr){
                    let arr = []
                    for(let i=0; i<dataArr.length; i++){
                        let obj = dataArr[i]
                        let nm = obj.Name.substring(0, 15)
                        let address = obj.Player
                        let addr = address.substring(0,4)+'...'
                        arr.push({index:i, nameTf:nm, name:obj.Name, addrTf:addr, addr:obj.Player, visitTf:obj.VisitCount, gotoBtn:''})
                    }
                    return arr
                }
                function handleData1(dataArr){
                    let arr = []
                    for(let i=0; i<dataArr.length; i++){
                        let obj = dataArr[i]
                        let address = obj
                        let addr = address.substring(0,15)+'...'+address.substring(address.length-15)
                        arr.push({index:i, addrTf:addr, addr:address,  gotoBtn:''})
                    }
                    return arr
                }
                function initCellBC(inst, value){
                    inst['icon'].gotoAndStop(value == 'add' ? 0 : 1)
                }
                function cellClikHandler(e){
                    if(e.target == 'nameBtn'){
                        window.utils.copyToClipboard(e.data.name)
                        window.utils.tip('Copied')
                    }else if(e.target == 'addrBtn'){
                        let url = window.location.origin+'?farm='+e.data.addr
                        window.utils.copyToClipboard(url)
                        window.utils.tip('Copied')
                    }else if(e.target == 'gotoBtn'){
                        followPopup.remove()
                        switchFarm(e.data.addr)
                    }else if(e.target == 'visitBtn'){
                    }
                }
            }, 50)
        })

        bar.list.copyInviterBtn.on('click', ()=>{
            let url = window.location.origin+'?inviter='+window.data.walletAddress
            window.utils.copyToClipboard(url)
            window.utils.tip('Copied')
        })
        bar.list.editNameBtn.on('click', editFarmName)
        bar.list.editNoticeBtn.on('click', editNotice)

        //设置屏幕适配
        let adaptType = window.utils.getScreenAdapt()
        bar.list.fixedBtn.on('click', ()=>{ adaptFun(2) })
        bar.list.adaptBtn.on('click', ()=>{ adaptFun(1) })
        bar.list.fullBtn.on('click', ()=>{ adaptFun(0) })
        function adaptFun(n){
            if(adaptType == n) return
            window.utils.setScreenAdapt(n)
            window.utils.sendMsgToParent({oper:'refresh'})
        }
        
        window.utils.enableMc(bar.list.fixedBtn, adaptType == 2 ? false : true, true)
        window.utils.enableMc(bar.list.adaptBtn, adaptType == 1 ? false : true, true)
        window.utils.enableMc(bar.list.fullBtn, adaptType == 0 ? false : true, true)

        self.gotoBtn.on('click', ()=>{
            getRandomFarm()
        })

        //如果本地缓存了自己的农场进程ID，就直接进程自己的农场，否则就登录
        // let myFarmProcess = window.utils.getMyFarmProcess()
        // if(myFarmProcess){
        //     window.data.myFarmProcess = window.data.curFarmProcess = myFarmProcess
        // }else{
        //     login()
        // }
        login()
    }
    function login(){
        let params =  window.utils.getUrlParams()
        let inviter = params.inviter ? params.inviter : ''
        window.utils.sendMsgToParent({oper:'login', inviter}, false)
    }
    function loginReply(obj){
        window.data.inviterUrl = obj.InviterUrl
        self.noticeDetailsBtn.on('click', ()=>{
            window.open(window.data.curDetailsUrl, '_blank')
        })
        self.getDogBtn.on('click', ()=>{
            window.utils.sendMsgToParent({oper:'freegetGetDog'})
        })
        setBalance(obj)
        //获取农场信息
        getFarmInfo()
        //getInfoFromMainFarm()
        //是否需要跳到其它农场
        if(window.utils.getUrlParams().farm) hasUrlFarmId = true
    }

    function getUserInfoReply(obj){
        setBalance(obj)
        //获取农场信息
        getFarmInfo(null, false)
    }

    /** 设置余额 */
    function setBalance(obj){
        let balance = Math.round(parseFloat(obj.Balance)/1000000000000)
        self.parent.userInfoBar.list.tokensTf.text = balance
        let bar = self.parent.centerBar
        bar.points0Tf.text = obj.Credits
        bar.points1Tf.text = obj.Credits
    }
    /** 获取用户余额 */
    function getBalance(){
        return parseInt(self.parent.userInfoBar.list.tokensTf.text)
    }
    /** 设置用户积分 */
    function addPoints(num=100){
        let bar = self.parent.centerBar
        let setIntervalId = setInterval(() => {
            let n = num > 3 ? 3 : num
            let v = parseInt(bar.points0Tf.text)
            bar.points0Tf.text = bar.points1Tf.text = v+n
            num -= 3
            if(num < 0) clearInterval(setIntervalId)
        }, 50);
    }


    /** 编辑农场名称 */
    function editFarmName(){
        let str =  `<div style="background-color:rgba(0, 0, 0, 0.1); width: 100vw; height: 100vh; position:absolute; left: 0; top:0; display:flex; justify-content:center; align-items:center; flex-direction: column;">
                <div style="background-color: rgba(131,47,3,0.8); border:3px #5B2502 solid; border-radius:20px; width:500px; height:250px; margin-bottom:100px;">
                    <div style="margin-left:20px; color:#FF6704; margin-top:20px; margin-bottom:10px;">Farm name:</div>
                    <input type="text" id="editFarmName" maxlength="30" style="width:300px; font-size: 20px; color:#FFCC00; border: none; outline: none; border-bottom:#FFCC00 1px solid; background:transparent; margin-left: 20px;">
                    <div style="margin-left:20px; color:#FF6704; margin-top:30px; margin-bottom:10px;">Twitter account：</div>
                    <input type="text" id="editTwitterUrl" maxlength="100" style="width:460px; font-size: 20px; color:#FFCC00; border: none; outline: none; border-bottom:#FFCC00 1px solid; background:transparent; margin-left: 20px;">
                    <div style="display:flex; margin-left: 300px; margin-top: 30px;" >
                        <div id="editFarmeNameCancelBtn" style="width:60px; height:40px; border:solid 2px #5B2502; color:#FF6704; text-align: center; cursor: pointer; line-height: 40px; border-radius: 10px;  user-select: none;" >Close</div>
                        <div id="editFarmeNameOkBtn"  style="width:60px; height:40px; background-color:#5B2502; color:#FF6704; text-align: center; cursor: pointer; line-height: 40px; border-radius: 10px; margin-left:60px; user-select: none;" >OK</div>
                    </div>
                </div>
            </div>`
        let holder = document.createElement('div')
        document.body.appendChild(holder)
        holder.style.position = 'absolute'
        holder.innerHTML = str

        let farmName = document.getElementById('editFarmName')
        let twitterUrl = document.getElementById('editTwitterUrl')
        let cancelBtn = document.getElementById('editFarmeNameCancelBtn')
        let okBtn = document.getElementById('editFarmeNameOkBtn')
        farmName.value = window.data.curFarmName
        twitterUrl.value = window.data.curTwitterAccount
        farmName.focus()
        cancelBtn.addEventListener('click', e=>{
            document.body.removeChild(holder)
        })
        okBtn.addEventListener('click', e=>{
            setFarmName(farmName.value, twitterUrl.value)
            window.utils.sendMsgToParent({oper:'editFrameName', name:farmName.value, twitter:twitterUrl.value})
            document.body.removeChild(holder)
        })
    }
    
    /** 编辑通知内容 */
    function editNotice(){
        let str =  `<div style="background-color:rgba(0, 0, 0, 0.1); width: 100vw; height: 100vh; position:absolute; left: 0; top:0; display:flex; justify-content:center; align-items:center; flex-direction: column;">
            <div style="background-color: rgba(131,47,3,0.8); border:3px #5B2502 solid; border-radius:20px; width:500px; height:305px; margin-bottom:100px;">
                <div style="margin-left:20px; color:#FF6704; margin-top:20px; margin-bottom:10px;">Notification content:</div>
                <textarea rows="3" id="editNoticeContent" maxlength="100" style="width:460px; font-size: 20px; color:#FFCC00; border: none; outline: none; border-bottom:#FFCC00 1px solid; background:transparent; margin-left: 20px;"></textarea>
                <div style="margin-left:20px; color:#FF6704; margin-top:30px; margin-bottom:10px;">Details URL：</div>
                <input type="text" id="editDetailsUrl" maxlength="60" style="width:460px; font-size: 20px; color:#FFCC00; border: none; outline: none; border-bottom:#FFCC00 1px solid; background:transparent; margin-left: 20px;">
                <div style="display:flex; margin-left: 300px; margin-top: 30px;" >
                    <div id="editNoticeContentCancelBtn" style="width:60px; height:40px; border:solid 2px #5B2502; color:#FF6704; text-align: center; cursor: pointer; line-height: 40px; border-radius: 10px;  user-select: none;" >Close</div>
                    <div id="editNoticeContentOkBtn"  style="width:60px; height:40px; background-color:#5B2502; color:#FF6704; text-align: center; cursor: pointer; line-height: 40px; border-radius: 10px; margin-left:60px; user-select: none;" >OK</div>
                </div>
            </div>
        </div>`
        let holder = document.createElement('div')
        document.body.appendChild(holder)
        holder.style.position = 'absolute'
        holder.innerHTML = str

        let noticeContent = document.getElementById('editNoticeContent')
        let detailsUrl = document.getElementById('editDetailsUrl')
        let cancelBtn = document.getElementById('editNoticeContentCancelBtn')
        let okBtn = document.getElementById('editNoticeContentOkBtn')
        noticeContent.value = window.data.curNoticeContent
        detailsUrl.value = window.data.curDetailsUrl
        noticeContent.focus()
        cancelBtn.addEventListener('click', e=>{
            document.body.removeChild(holder)
        })
        okBtn.addEventListener('click', e=>{
            let c = noticeContent.value.replace(/\n/ig, ' ').replace(/\r/ig, '')
            let str = c+'|:|'+detailsUrl.value
            setNoticePanel(str)
            window.utils.sendMsgToParent({oper:'editNotice', content:str})
            document.body.removeChild(holder)
        })
    }

    //--------------------------------------------他人的农场-----------------------------------------
    let other_follow_panel
    let other_following
    let other_followers
    /* 此变量主要判断通过Url参数传递farm地址时，直接去到指定的农场 */
    let hasUrlFarmId
    function otherFarm(){
        let farm = self.parent.otherFarm
        farm.twitterBtn.on('click', ()=>{
            window.open('https://www.x.com/'+window.data.curTwitterAccount, '_blank')
        })
        farm.unfollowBtn.visible = false
        farm.followBtn.on('click', ()=>{
            window.utils.sendMsgToParent({oper:'follow', player:window.data.curPlayer})
        })
        farm.unfollowBtn.on('click', ()=>{
            window.utils.sendMsgToParent({oper:'unfollow', player:window.data.curPlayer})
        })
        farm.gohomeBtn.on('click', ()=>{ 
            switchFarm(window.data.walletAddress)
         })
        farm.followList.followingBtn.on('click', ()=>{ openList(0) })
        farm.followList.followersBtn.on('click', ()=>{ openList(i) })
        let followPopup
        function openList(index){
            //关闭推荐面板
            self.parent.recommend.closeBtn.dispatchEvent('click')

            if(other_follow_panel){
                followPopup = window.utils.popupPanel(other_follow_panel, 10, 75, 0, 0.3, ()=>{
                    followPopup.remove()
                })
                return
            }
            let mc = other_follow_panel = window.utils.createMC('Other_FollowPanel');
            mc.visible = false
            followPopup = window.utils.popupPanel(mc, 10, 75, 0, 0.3, ()=>{
                followPopup.remove()
            })
            setTimeout(createFollowPanel, 50, mc, index)
        }
        function createFollowPanel(mc, index){
            mc.visible = true
            window.utils.tabBar([mc.tab0, mc.tab1], [mc.panel0, mc.panel1], (e)=>{
                if(e.name == 'tab0'){
                    if(other_following) return
                    mc.panel0.removeAllChildren()
                    window.data.getOtherFollowing((arr)=>{
                        let itemArr = handleData(arr)
                        let uiCfg = {item:'other_followingPanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                        other_following = window.utils.listPanel(mc.panel0, uiCfg, itemArr, 15, 5, cellClikHandler)
                    })
                }else if(e.name == 'tab1'){
                    if(other_followers) return
                    mc.panel1.removeAllChildren()
                    window.data.getOtherFollowers((arr)=>{
                        let itemArr = handleData(arr)
                        let uiCfg = {item:'other_followersPanelItem', prev:'PrevPageBtn1', turn:'PageNumber1', next:'NextPageBtn1'}
                        other_followers = window.utils.listPanel(mc.panel1, uiCfg, itemArr, 15, 5, cellClikHandler)
                    })
                }
            }, index)
            function handleData(dataArr){
                let arr = []
                for(let i=0; i<dataArr.length; i++){
                    let obj = dataArr[i]
                    let nm = obj.Name.substring(0, 12)
                    let addr = obj.Player.substring(0,4)+'...'
                    arr.push({index:i, nameTf:nm, name:obj.Name, addrTf:addr, addr:obj.Player, gotoBtn:''})
                }
                return arr
            }
            function cellClikHandler(e){
                if(e.target == 'nameBtn'){
                    window.utils.copyToClipboard(e.data.name)
                    window.utils.tip('Copied')
                }else if(e.target == 'addrBtn'){
                    let url = window.location.origin+'?farm='+e.data.addr
                    window.utils.copyToClipboard(url)
                    window.utils.tip('Copied')
                }else if(e.target == 'gotoBtn'){
                    followPopup.remove()
                    switchFarm(e.data.addr)
                }
            }
        }
    }

    /** 设置农场名称 */
    function setFarmName(name, twitter){
        let farm = self.parent.otherFarm
        let num = window.data.walletAddress == window.data.curPlayer ? 18 : 11
        let s = name.substring(0, num)
        farm.nameTf.text = s
        farm.nameTf1.text = s
        if(twitter){
            farm.icon.visible = false
            farm.twitterBtn.visible = true
        }else{
            farm.icon.visible = true
            farm.twitterBtn.visible = false
        }
        window.utils.textToBtn(farm.nameTf, '#A2E33E', '#FFF', '#FFFF00', ()=>{
            let url = window.location.origin+'?farm='+window.data.curPlayer
            window.utils.copyToClipboard(url)
            window.utils.tip('Url copied')
        })
        window.data.curFarmName = name
        //设置推特帐号
        window.data.curTwitterAccount = twitter ? twitter : ''
    }

    /** 设置通知面板 */
    function setNoticePanel(str){
        let arr = str.split('|:|')
        let content = arr[0] ? arr[0] : ''
        let url = arr[1] ? arr[1] : ''
        window.data.curNoticeContent = content
        window.data.curDetailsUrl = url
        self.noticeDetailsBtn.visible = !!url
        let ss = handleWrap(content)
        self.noticeTf0.text = ss
        self.noticeTf1.text = ss
    }
    function handleWrap(content){
        let n = 13
        let s = 0
        let row = 0
        let tfW =  self.noticeTf0.lineWidth
        let str = ''
        let numRow = self.noticeDetailsBtn.visible ? 4 : 5
        while(true){
            if(row < numRow && n > content.length){
                str += content.substring(s, n-1)
                break
            }
            if(row == numRow) break
            self.noticeTf0.text = content.substring(s, ++n)
            if(self.noticeTf0.getMeasuredWidth() > tfW){
                str += content.substring(s, n-1)+'\n'
                s = n-1
                row++
                n += 13
            }
        }
        return str
    }

    /** 修改关注或取消关注的状态 */
    function setFollowState(player){
        let farm = self.parent.otherFarm
        let follow = window.data.isFollowing(player)
        farm.followBtn.visible = !follow
        farm.unfollowBtn.visible = follow
    }

    //--------------------------------------------商店功能-------------------------------------------
    self.shop.shopBtn.on('click', openShop)
    function openShop(){
        let shopPanel = window.utils.createMC('ShopPanel')
        let mc = shopPanel
        mc.visible = false
        let panel = window.utils.popupPanel(mc, -1, -1, -50)
        setTimeout(()=>{
            mc.closeBtn.on('click', ()=>{ panel.remove() })
            window.utils.tabBar([mc.tab0, mc.tab1], [mc.panel0, mc.panel1])
            mc.visible = true
            setBuy()
            setSell()
        }, 50)

        function setBuy(){
            let mc = shopPanel.panel0;
            let maxAmount = Math.floor(getBalance()/10)
            maxAmount = maxAmount ? maxAmount : 0
            mc.okBtn.on('click', ()=>{
                let amount = parseInt(mc.amountTf.text)
                if(amount > maxAmount){
                    window.utils.alert('Sorry, balance is not enough')
                    return
                }
                addPoints()
                window.utils.sendMsgToParent({oper:'buy', amount:''+amount})
                panel.remove()
            })
            //百分比条
            window.utils.percentageBar(mc.percentage, (r)=>{
                mc.amountTf.text = (r == 0) ? '' : Math.floor(r*maxAmount)
            })
            //设置数字键盘
            window.utils.setNumKeyboard(mc.amountTf, mc.keyboard, 10, maxAmount)
        }
        function setSell(){
            let mc = shopPanel.panel1;
            let maxAmount = getFruitNum()
            maxAmount = maxAmount ? maxAmount : 0
            mc.okBtn.on('click', ()=>{
                if(maxAmount <= 0){
                    window.utils.alert('You do not have any fruit to sell')
                    return
                }
                addPoints()
                window.utils.sendMsgToParent({oper:'sell', amount: mc.amountTf.text})
                panel.remove()
            })
            //百分比条
            window.utils.percentageBar(mc.percentage, (r)=>{
                mc.amountTf.text = (r == 0) ? '' : Math.floor(r*maxAmount)
            })
            //设置数字键盘
            window.utils.setNumKeyboard(mc.amountTf, mc.keyboard, maxAmount, maxAmount)
        }
    }

    //------------------------------------------以下是充值提现-------------------------------------------
    //要提现的数量
    let withDrawAmount
    function cash(){
        //提现
        self.parent.userInfoBar.list.withdrawBtn.on('click', ()=>{
            let maxAmount = getBalance()
            let mc = window.utils.createMC('WithdrawPanel');
            let panel = window.utils.popupPanel(mc, -1, -1, -100)
            mc.addrTf.text = window.data.walletAddress
            mc.okBtn.on('click', ()=>{
                withDrawAmount = parseFloat(mc.amountTf.text);
                if(withDrawAmount < 1){
                    window.utils.tip('The withdrawal amount is incorrect')
                    return
                }
                addPoints()
                window.utils.sendMsgToParent({oper:'withdraw', amount:''+(withDrawAmount*1000000000000)})
                panel.remove()
            })
            //百分比条
            window.utils.percentageBar(mc.percentage, (r)=>{
                mc.amountTf.text = (r == 0) ? '' : Math.floor(r*maxAmount)
            })
            //设置数字键盘
            window.utils.setNumKeyboard(mc.amountTf, mc.keyboard, maxAmount, maxAmount)
        })
        
        //充值
        self.parent.userInfoBar.list.rechargeBtn.on('click', ()=>{
            let mc = window.utils.createMC('RechargePanel');
            let panel = window.utils.popupPanel(mc, -1, -1, -100)
            mc.okBtn.on('click', ()=>{
                let rechargeAmount = parseInt(mc.amountTf.text);
                if(rechargeAmount < 1){
                    window.utils.tip('The deposit amount is incorrect')
                    return
                }
                addPoints()
                window.utils.sendMsgToParent({oper:'recharge', amount:''+(rechargeAmount*1000000000000)})
                panel.remove()
            })
            //设置数字键盘
            window.utils.setNumKeyboard(mc.amountTf, mc.keyboard, 100)
        })
    }

    function withdrawReply(){
        let amount = parseInt(self.parent.userInfoBar.list.tokensTf.text)
        self.parent.userInfoBar.list.tokensTf.text = amount - withDrawAmount
        window.utils.tip('Withdrawal successful')
    }

    //-----------------------------------------------种植相关的操作-------------------------------------------
    function getRandomFarm(){
        clearFarm()
        window.utils.sendMsgToParent({oper:'randomFarm', player:window.data.curPlayer})
    }

    function switchFarm(player){
        clearFarm()
        getFarmInfo(player)
    }

    function clearFarm(){
        window.data.clear()
        other_follow_panel = null
        other_following = null
        other_followers = null
        if(self.dog.visible) self.dog.alpha = 0
    }

    function getInfoFromMainFarm(){
        let player = window.data.curPlayer
        window.utils.sendMsgToParent({oper:'getInfoFromMainFarm', player})
    }
    function getInfoFromMainFarmReplay(obj){
        console.log(obj)
        getFarmInfo()
    }

    function getFarmInfo(player=null, isLoading=true, isCircle=true){
        if(player == null) player = window.data.curPlayer
        window.utils.sendMsgToParent({oper:'getFarmInfo', player}, isLoading, isCircle)
    }
    function getFarmInfoReply(obj){
        //console.log(obj)
        //缓存当前农场的信息
        window.data.curFarmInfo = obj
        window.data.curPlayer = obj.Player
        window.data.curFarmName = obj.FarmName
        let farm = self.parent.otherFarm
        let isSelf = window.data.isSelf()
        farm.gohomeBtn.visible = !isSelf
        farm.followList.visible = !isSelf
        if(isSelf){
            self.parent.userInfoBar.visible = true
            farm.followBtn.visible = false
            farm.unfollowBtn.visible = false
            self.shop.visible = true
        }else{
            self.shop.visible = false
            self.parent.userInfoBar.visible = false
            setFollowState(obj.Player)
        }
        setFarmName(obj.FarmName, obj.Twitter)
        setNoticePanel(obj.Notice)

        if(window.data.curTwitterAccount == ''){
            farm.icon.visible = true
            farm.twitterBtn.visible = false
        }else{
            farm.icon.visible = false
            farm.twitterBtn.visible = true
        }
        
        if(obj.CanFreegetDog == true){
            self.getDogBtn.visible = window.data.isSelf()
            self.dog.visible = false
        }else{
            self.getDogBtn.visible = false
            self.dog.visible = true
        }

        if(isSelf){
            let arr = obj.Inventories
            for(let i=0; i<arr.length; i++){
                if(arr[i].Category == 'Seed'){
                    updateSeedNum(obj.Inventories[i].Amount, 'init')
                }else if(arr[i].Category == 'Fruit'){
                    updateFruitNum(obj.Inventories[i].Amount, 'init')
                }
            }
        }
        
        setField(obj.Fields)

        if(hasUrlFarmId == true){
            hasUrlFarmId = false
            switchFarm(window.utils.getUrlParams().farm)
        }else{
            //删除启动动画，显示主界面
            removeStartupAni()
        }

        if(self.dog.visible) self.dog.alpha = 1
    }

    /** 设置土地的状态 */
    function setField(arr){
        let isSelf = window.data.isSelf()
        for(let i=0; i<arr.length; i++){
            let field = self['field'+i]
            let phase = arr[i].SeedPhase
            field.fruitMc.visible = false
            field.shovel.visible = false
            field.cursor = 'pointer'
            if(phase == ''){
                if(!isSelf) field.cursor = 'arrow'
                field.gotoAndStop(0)
            }else if(phase == 'Seed'){
                field.gotoAndStop(1)
            }else if(phase == 'Burgeon'){
                field.gotoAndStop(2)
            }else if(phase == 'Growth'){
                field.gotoAndStop(3)
            }else if(phase == 'Bloom'){
                field.gotoAndStop(4)
            }else if(phase == 'Fruit'){
                field.gotoAndStop(5)
                setTimeout(()=>{
                    field.hand.visible = false
                    field.fruitMc.visible = true
                    field.fruitMc.gotoAndStop(arr[i].FruitAmount)
                }, 10)
            }

            field.removeAllEventListeners()
            field.on('click', (e)=>{
                if(field.currentFrame == 0){
                    //种植
                    if(isSelf)  plant(e)
                }else if(field.currentFrame == 5){
                    //收获
                    if(isSelf || !arr[i].IsStealed) harvest(e)
                }else{
                    //浇水
                    if(arr[i].Watered == false) water(e)
                }
            })

            field.on('mouseover', ()=>{
                if(field.currentFrame == 0){
                    if(isSelf) field.shovel.visible = true
                }else if(field.currentFrame == 5){
                    if(!isSelf && arr[i].IsStealed){
                        field.prohibit.visible = true
                    }else{
                        field.hand.visible = true
                    }
                }else{
                    field.time.tf.text = getCdTime(field)
                    field.time.visible = true
                    if(arr[i].Watered == false) field.kettle.visible = true
                }
            })
            field.on('mouseout', ()=>{
                if(field.currentFrame == 0){
                    field.shovel.visible = false
                }else if(field.currentFrame == 5){
                    field.prohibit.visible = false
                    field.hand.visible = false
                }else{
                    field.time.visible = false
                    field.kettle.visible = false
                }
            })
        }
    }
    //计算剩余时间
    function getCdTime(field){
        let obj = getFieldInfo(field)
        let millisecond
        let curTime = new Date().getTime()
        if(obj.NextPhaseTime == -1){
            millisecond = curTime - obj.PlantedTime
        }else{
            let plantedTime = obj.PlantedTime
            let timestamp = window.data.curFarmInfo.Timestamp
            let deltaTime = curTime - timestamp
            millisecond = (timestamp+deltaTime)-plantedTime
        }
        millisecond = window.data.generationTime*60000-millisecond
        if(millisecond <= 0){
            //getFarmInfo()
            return '0m 0s'
        }
        let H = Math.floor(millisecond/3600000)
        let M = Math.floor((millisecond-H*3600000)/60000)
        let S = Math.floor((millisecond-(H*3600000+M*60000))/1000)
        return H > 0 ? H+'h '+M+'m' : M+'m '+S+'s'
    }

    /** 种植 */
    let plantAni
    let curField = null;
    function plant(e){
        if(getSeedNum() <= 0){
            window.utils.confirm("You no longer have seeds, please purchase seeds first", openShop)
            return
        }
        addPoints()
        curField = e.currentTarget
        plantAni = window.utils.createMC('PlantAni')
        plantAni.gotoAndPlay(1)
        plantAni.x = curField.x-15
        plantAni.y = curField.y-100
        self.addChild(plantAni)
        curField.shovel.visible = false
        let index = ''+(parseInt(e.currentTarget.name.substring(5))+1)
        window.utils.sendMsgToParent({oper:'plant', fieldId:index, seedType:'Apple'}, true, false)
    }
    /** 种植成功返回 */
    function plantReply(obj){
        let fieldInfo = getFieldInfo(curField)
        //设置本地缓存的数据为已经种植状态
        fieldInfo.SeedPhase = 'Seed'
        fieldInfo.PlantedTime = (new Date()).getTime()
        fieldInfo.NextPhaseTime = -1

        if(plantAni){
            plantAni.stop()
            self.removeChild(plantAni)
            plantAni = null
        }
        //播放特效
        let star = window.utils.createMC('StarAni')
        star.x = curField.x
        star.y = curField.y-20
        star.scaleX = star.scaleY = 2
        star.gotoAndPlay(1)
        self.addChild(star)
        curField.gotoAndStop(1)
        updateSeedNum(1, 'reduce')
    }

    /** 浇水 */
    let waterAni
    function water(e){
        addPoints()
        curField = e.currentTarget
        curField.kettle.visible = false

        //判断是否已经浇过水
        if(getFieldInfo(curField).Watered == true)  return
        
        let index = ''+(parseInt(e.currentTarget.name.substring(5))+1)
        window.utils.sendMsgToParent({oper:'water', fieldId:index, owner:window.data.curPlayer}, true, false)

        //播放特效
        waterAni = window.utils.createMC('WaterAni')
        waterAni.x = curField.x-40
        waterAni.y = curField.y-170
        waterAni.gotoAndPlay(1)
        self.addChild(waterAni)
        //设置错误时，要执行的函数
        errBc = removeWaterAni
    }
    /** 浇水成功返回 */
    function waterReply(obj){
        getFieldInfo(curField).Watered = true
        setField(window.data.curFarmInfo.Fields)

        removeWaterAni()
        window.utils.tip('Watering successfully', 600)
    }
    function removeWaterAni(){
        if(waterAni){
            self.removeChild(waterAni)
            waterAni = null
        }
    }

    /** 收获 */
    function harvest(e){
        addPoints()
        curField = e.currentTarget
        if(window.data.isSelf()) harvestAni()
        let index = ''+(parseInt(e.currentTarget.name.substring(5))+1)
        window.utils.sendMsgToParent({oper:'harvest', fieldId:index, owner:window.data.curPlayer}, true, false)
    }
    /** 种植成功返回 */
    function harvestReply(obj){
        //设置本地数据为以被偷
        getFieldInfo(curField).IsStealed = true
        let isSelf = window.data.isSelf()
        if(isSelf == false && obj.Amount == 0 && self.dog.visible == true){
            dogWoof()
            return
        }
        //播放特效
        if(isSelf == false) harvestAni(obj.Amount)
        //重新更新农场状态
        getFarmInfo(null, true, false)
    }
    function harvestAni(fruitNum){
        let bar = self.parent.centerBar
        let pt0
        let pt1
        if(window.utils.getScreenAdapt() == 0){
            pt0 = self.localToGlobal(curField.x, curField.y)
            pt1 = root.localToGlobal(bar.x, bar.y)
        }else{
            let rx = canvas.width/CW
            let ry = canvas.height/CH
            pt0 = self.localToGlobal(curField.x/rx, curField.y/ry)
            pt1 = root.localToGlobal(bar.x/rx, bar.y/ry)
        }

        let fruits = curField.fruitMc
        fruitNum = fruitNum ? fruitNum : fruits.currentFrame
        for(let i=0; i<fruitNum; i++){
            setTimeout(()=>{
                fruits.gotoAndStop(fruits.currentFrame-1)
                let mc = window.utils.createMC('FruitApple')
                mc.regX = mc.nominalBounds.width/2
                mc.regY =  mc.nominalBounds.height/2
                mc.x = pt0.x-10
                mc.y = pt0.y-70
                mc.scaleX = mc.scaleY = 0.1
                stage.addChild(mc)
                playSound('harvestSound')
                createjs.Tween.get(mc).to({scaleX:1, scaleY:1}, 200).to({scaleX:0.1, scaleY:0.1,x:pt1.x+135, y:pt1.y+40}, 300).call(()=>{
                    updateFruitNum(1, 'add')
                    stage.removeChild(mc)
                })
            }, 200*i)
        }
    }

    /** 增加或减少指定数量的种子 */
    function updateSeedNum(num, action='add'){
        let n = parseInt(self.parent.centerBar.seed0Tf.text)
        if(action == 'add'){
            num = num+n
        }else if(action == 'reduce'){
            num = n-num
        }
        self.parent.centerBar.seed0Tf.text = num
        self.parent.centerBar.seed1Tf.text = num
    }
    /** 获取种子数 */
    function getSeedNum(){
        return parseInt(self.parent.centerBar.seed0Tf.text)
    }

    /** 增加或减少指定数量的果实 */
    function updateFruitNum(num, action='add'){
        let n = parseInt(self.parent.centerBar.fruit0.text)
        if(action == 'add'){
            num = num+n
        }else if(action == 'reduce'){
            num = n-num
        }
        self.parent.centerBar.fruit0.text = num
        self.parent.centerBar.fruit1.text = num
    }
    /** 获取果实数 */
    function getFruitNum(){
        return parseInt(self.parent.centerBar.fruit0.text)
    }

    /** 获取本地缓存农场信息中的指定的地块信息 */
    function getFieldInfo(filed){
        let n = filed.name.substring(5)
        return window.data.curFarmInfo.Fields[n]
    }

    /** 匹配屏幕的高度 */
    function matchScreen(){
        let r = 1;
        let w = self.nominalBounds.width;
        let h = self.nominalBounds.height;
        self.regX = 0;
        self.regY = 0;
        if(SH > h){
            r = SH/h;
            self.scaleX = self.scaleY  = r;
            w = w*r;
            h = h*r;
        }
        self.x = (SW-w)/2;
        self.y = (SH-h)/2;
        window.utils.dragMC(self, false, true, false);
        self.on('dragStart', ()=>{
            // cacheMc(self);
        })
        self.on('dradragEndgStart', ()=>{
            //  uncacheMc(self);
        })
        self.on('drag', ()=>{
            if(self.x > 0){
                self.x = 0;
            } else if(self.x < SW-w){
                self.x = SW-w;
            }
            if(self.y > 0){
                self.y = 0;
            } else if(self.y < SH-h){
                self.y = SH-h;
            }
        })
        window.addEventListener('resize', ()=>{
            if(self.x < SW-w){
                self.x = SW-w;
            }
            if(self.y < SH-h){
                self.y = SH-h;
            }
            setTopLevel();
        });
        setTopLevel();
        function setTopLevel(){
            let w, h;
            let userInfo = self.parent['userInfoBar'];
            userInfo.regX = userInfo.regY = 0;
            userInfo.scaleX = userInfo.scaleY = r;
            userInfo.y = 8;
            w = userInfo.nominalBounds.width;
            userInfo.x = SW-w*r-5;

            let otherFarm = self.parent['otherFarm'];
            otherFarm.regX = otherFarm.regY = 0;
            otherFarm.scaleX = otherFarm.scaleY = r;
            otherFarm.y = -20;
            otherFarm.x = 10;

            let centerBar = self.parent['centerBar'];
            centerBar.y = 5;
            centerBar.x = SW/2;
        }
    }
}