(function(){
    let self = {}
    window.utils = self

    /** 向父级发送一个消息对象
     * @param obj 消息对象：{oper:'login', param:{naem:'wsl', pwd:'123456'}}
     * @param isLoading 是否显示加载动画
     * @param isCircle 是否显示转圈,就是有屏蔽操作，但是没有加载效果 */
    self.sendMsgToParent = (obj, isLoading=true, isCircle=true)=>{
        //统一设置当前农场进程ID
        obj.farmProcess = window.data.curFarmProcess
        window.parent.postMessage(obj)
        if(isLoading) self.showLoading(isCircle)
    }

    /** 获取我的农场进程 */
    self.getMyFarmProcess = ()=>{
        return localStorage.getItem('myFarmProcess')
    }
    //保存我的农场进程
    self.setMyFarmProcess = (processId)=>{
        localStorage.setItem('myFarmProcess', n)
    }

    /** 获取屏幕适配方式
     * @return 0 表示以全屏适配， 1 表示等比缩放， 2 表示固定 */
    self.getScreenAdapt = ()=>{
        return localStorage.getItem('screenAdapt') || 0
    }
    //保存屏幕适配方式
    self.setScreenAdapt = (n)=>{
        localStorage.setItem('screenAdapt', n)
    }


    let loadingView
    /** 显示Loding动画 */
    self.showLoading = (isCircle=true)=>{
        hasPopupPanel = true
        let bg, ani
        if(!loadingView){
            loadingView = new createjs.Container()
            bg = self.getTipBg()
            ani = self.createMC('LoadingAni')
            loadingView['bg'] = bg
            loadingView['ani'] = ani
            loadingView.addChild(bg)
            loadingView.addChild(ani)
            root.addChild(loadingView)
            window.addEventListener('resize', loadingResize);
            loadingResize()
        }else{
            loadingView.visible = true
            root.addChild(loadingView)
        }
        if(isCircle){
            loadingView.ani.visible = true
            loadingView.ani.gotoAndPlay(1)
            loadingView.bg.alpha = 0.3
        }else{
            loadingView.ani.stop()
            loadingView.ani.visible = false
            loadingView.bg.alpha = 0.05
        }
        function loadingResize(){
            let isFull = window.utils.getScreenAdapt() == 0
            let w = isFull ? SW : CW
            let h = isFull ? SH : CH
            let px = (w-ani.nominalBounds.width)/2
            let py = (h-ani.nominalBounds.height)/2
            loadingView.ani.x = px
            loadingView.ani.y = py
            loadingView.bg.graphics.clear()
            loadingView.bg.graphics.beginFill(colorToRGBA('#000000', 0.3)).drawRect(0, 0, w, h)
        }
    }
    /** 关闭loading动画 */
    self.hideLoading = ()=>{
        if(!loadingView) return
        hasPopupPanel = false
        loadingView.ani.stop()
        loadingView.visible = false
    }


    
    /** 创建弹出一个面板实例
     * @param mc 要弹出的面板实例
     * @param x 面板的X位置，-1表示居中
     * @param y 面板的Y位置，-1表示居中
     * @param alpha 背景层的透明度
     * @param offsetY 弹出内容在Y轴上的偏移量
     * @param bgClickFun 点击背景的回调
     * @param bgColor 背景的颜色
     * @param target 要添加到的容器 */
    let hasPopupPanel = false
    self.popupPanel = (mc, x=-1, y=-1, offsetY=0, alpha=0.3, bgClickFun=null, bgColor='#000000', target=null)=>{
        return new PopupPanel(mc, x, y, offsetY, alpha, bgClickFun, bgColor, target)
    }
    function PopupPanel(mc, x, y, offsetY, alpha, bgClickFun, bgColor, target){
        let holder = new createjs.Container()
        target = target ? target : root
        target.addChild(holder)
        hasPopupPanel = true

        let bg = self.getTipBg(bgClickFun, bgColor, alpha)
        holder.addChild(bg)

        this.remove = ()=>{
            window.removeEventListener('resize', resize)
            holder.parent.removeChild(holder);
            hasPopupPanel = false
        }
        this.getContent = ()=>{ return mc } 
        
        if(mc.cancelBtn){
            mc.cancelBtn.removeAllEventListeners('click')
            mc.cancelBtn.on('click', this.remove)
        } 
        mc.regX = mc.regY = 0
        holder.addChild(mc)
        
        let isFull = window.utils.getScreenAdapt() == 0
        if(isFull) window.addEventListener('resize', resize);
        resize()
        function resize(){
            let w = isFull ? SW : CW
            let h = isFull ? SH : CH
            let px = (x == -1) ? (w-mc.nominalBounds.width)/2 : x
            let py = (y == -1) ? (h-mc.nominalBounds.height)/2+offsetY : y
            mc.x = px
            mc.y = py
            bg.graphics.clear()
            bg.graphics.beginFill(colorToRGBA(bgColor, alpha)).drawRect(0, 0, w, h)
        }
    }
    self.hasPopupPanel = ()=>{
        return hasPopupPanel
    }
    
    /** 显示一个条型提示，2秒后自动消失 */
    self.tip = (msg, time=2000)=>{
        let mc = self.createMC('Tip');
        mc.msgTf.text = msg
        let popupPanel = window.utils.popupPanel(mc, -1, -1, -50)
        setTimeout(()=>{ popupPanel.remove() }, time)
    }

    /** 创建一个提示框，
     * @param msg 要提示的内容字符串。
     * @param isCancelBtn 是否显示取消按钮 */
    self.alert = (msg, isCancelBtn=true)=>{
        let alert = self.createMC('Alert')
        if(!isCancelBtn) alert.cancelBtn.visible = false
        let tf = alert.msgTf
        tf.text = msg;
        tf.regx = 0
        tf.regy = 0
        let m = tf.getMetrics()
        tf.x = 50+(440-m.width)/2
        tf.y = 77+(158-m.height)/2
        window.utils.popupPanel(alert, -1, -1, -50)
    }

    /** 创建一个提示框，
     * @param msg 要提示的内容字符串。
     * @param backcall 点击ok按钮后，要执行的回调方法
     * @param holder 要添加到的容器，默认为root, 可以添加到stage */
    self.confirm = (msg, backcall, holder)=>{
        let panel = self.createMC('Confirm')
        let tf = panel.msgTf
        tf.text = msg
        tf.regx = 0
        tf.regy = 0
        let m = tf.getMetrics()
        tf.x = 215+(440-m.width)/2
        tf.y = 80+(158-m.height)/2
        
        let popupPanel = window.utils.popupPanel(panel, -1, -1, -50, 0.3, null, '#000000', holder)
        panel.okBtn.on('click', ()=>{
            popupPanel.remove()
            if(backcall) backcall()
        })
    }

    /** 获取一个弹出框的背景
     * @param fun 点击背景时要执行的函数
     * @param color 背景颜色
     * @param alpha 背景透明度 */
    self.getTipBg = (fun=null, color='#000000', alpha=0.3)=>{
        let isFull = window.utils.getScreenAdapt() == 0
        let w = isFull ? SW : CW
        let h = isFull ? SH : SH
        let shape = new createjs.Shape()
        shape.graphics.beginFill(colorToRGBA(color, alpha)).drawRect(0, 0, w, h)
        shape.on('click', ()=>{ if(fun) fun() })
        return shape
    }

    /** 十六进制颜色转rgba */
    function colorToRGBA(color, alpha=1) {
        return 'rgba('+parseInt(color.substring(1, 3), 16)+','+parseInt(color.substring(3, 5), 16)+','+ parseInt(color.substring(5, 7))+','+alpha+')'
    }


    /** 设置数字键盘
     * @param tf 要控制的输入文本字段
     * @param kb 键盘实例
     * @param defaultValue 默认值
     * @param max 能输入的最大值，默认值:9999999 */
    self.setNumKeyboard = (tf, kb, defaultValue=null, max=9999999)=>{
        if(defaultValue){
            tf.text = defaultValue
        }else{
            tf.text = '0'
        }
        let keyArr = ['0','1','2','3','4','5','6','7','8','9','⌫']
        for(let i=0; i<11; i++){
            kb['key'+i].tf.text = keyArr[i]
            kb['key'+i].on('click', (e)=>{
                let curValue = e.currentTarget.tf.text
                if(curValue == '⌫'){
                    let t = tf.text
                    if(t.length == 0 ){
                    }else{
                        let s = ''+tf.text
                        tf.text = s.substring(0, s.length-1)
                    }
                }else{
                    let t = parseInt(tf.text+curValue)
                    if(tf.text.length == 0 && curValue == '0'){
                        self.alert('The first number cannot be 0 ')
                        return
                    }
                    if(t > max){
                        self.alert('The maximum value is '+max)
                        return
                    }
                    tf.text += curValue
                }
            })
        }
    }

    /** 设置百分比条
     * @param mc 要控制的百分比实例
     * @param fun 选择百分比时的回调函数，接收当前的百分比值作为参数  */
    self.percentageBar = (mc, fun)=>{
        let arr = [0, 0.25, 0.5, 0.75, 1]
        for(let i=0; i<arr.length; i++){
            mc['p'+i].on('click', (e)=>{
                let n = parseInt(e.currentTarget.name.substring(1))
                fun(arr[n])
            })
        }
    }

    /** 滑动条
     * @param slider 滑动条实例
     * @param fun 滑动时的回调函数，接收当前滑动值作为参数 */
    self.sliderBar = (slider, fun)=>{
        var maskMc = new createjs.Shape(); 
        maskMc.graphics.beginFill("#000000").drawRect(0, 0, 300, 32);
        slider.track.mask = maskMc;
        maskMc.scaleX = 0;
        
        let thumb = slider.thumb;
        thumb.on('drag', ()=>{
            if(thumb.x < 0) thumb.x = 0;
            if(thumb.x > 300) thumb.x = 300;
            let r = thumb.x/300; 
            maskMc.scaleX = r;
            if(fun) fun(r)
        })
        self.dragMC(thumb, false, false)
    }

    /** Tab条
     * @param tabs tab实例数组
     * @param panels 某一个tab对应的面板
     * @param fun tab选择时的回调函数
     * @param select 默认选择0 */
    self.tabBar = (tabs, panels, fun=null, select=0)=>{
        for(let i=0; i<tabs.length; i++){
            panels[i].visible = false
            tabs[i].cursor = 'pointer'
            tabs[i].mouseChildren = false
            tabs[i].gotoAndStop(0)
            tabs[i].on('click', (e)=>{
                curTab.gotoAndStop(0)
                self.enableMc(curTab, true)
                curPanel.visible = false
                let tab = e.currentTarget
                self.enableMc(tab, false)
                tab.gotoAndStop(2)
                let n = parseInt(tab.name.substring(3))
                curPanel = panels[n]
                curPanel.visible = true
                curTab = tab
                if(fun) fun(curTab)
            })
            tabs[i].on('mouseover', (e)=>{
                e.currentTarget.gotoAndStop(1)
            })
            tabs[i].on('mouseout', (e)=>{
                if(curTab == e.currentTarget) return
                e.currentTarget.gotoAndStop(0)
            })
        }
        let curTab = tabs[select]
        let curPanel = panels[select]
        curTab.gotoAndStop(2)
        self.enableMc(curTab, false)
        curPanel.visible = true
        if(fun) fun(curTab)
    }

    /** 创建列表面板
     * @param holder 列表支架
     * @param obj 包含所用到的元素名称：{item:'', prev:'', turn:'', next:''}
     * @param arr 每一行的数据对象数组
     * @param pageItemNum 每一页的实例数
     * @param turnPageBarBtnNum 最多显示几个页码，多了后会出现滚动按钮
     * @param fun  点击每一个单元格时的回调函数 */
    self.listPanel = (holder, obj, arr, pageItemNum, turnPageBarBtnNum, fun, gap=2)=>{
        holder.removeAllChildren()
        let totalItemNum = arr.length
        let itemH
        let turnBar

        function createItem(pageNum){
            holder.removeAllChildren()
            if(turnBar) holder.addChild(turnBar)
            
            let len = totalItemNum > pageItemNum+1 ? pageItemNum : totalItemNum
            let start = pageNum*pageItemNum
            let end = start+len > arr.length ? arr.length : start+len
            let cnt = 0
            for(let i=start; i<end; i++){
                let inst = self.createMC(obj.item)
                if(!itemH) itemH = inst.nominalBounds.height+gap
                inst.y = itemH*cnt
                holder.addChild(inst)
                let data = arr[i]
                for(let nm in data){
                    if(nm.substring(nm.length-2) == 'Tf'){
                        inst[nm].text = data[nm]
                        //如果有文本字段对应的背景按钮，则添加点击事件
                        let btn = inst[nm.substring(0, nm.length-2)+'Btn']
                        if(btn){
                            btn.data = data
                            btn.on('click', e=>{
                               if(fun) fun({inst:e.currentTarget.parent, target:e.currentTarget.name, data:e.currentTarget.data})
                            })
                        }
                    }else if(nm.substring(nm.length-3) == 'Btn'){
                        inst[nm].data = data
                        //直接把点击事件添加再背景按钮上
                        inst[nm].on('click', e=>{
                            if(fun) fun({inst:e.currentTarget.parent, target:e.currentTarget.name, data:e.currentTarget.data})
                        })
                        //如果有字段的回调函数，则调用
                        let bcFun = data[nm.substring(0, nm.length-3)+'Fun']
                        
                        if(bcFun) setTimeout(bcFun, 50, inst, data[nm])
                    }
                }
                cnt++
            }
        }
        createItem(0)
        if(totalItemNum > pageItemNum+1){
            let btnNum = Math.ceil(totalItemNum/pageItemNum)
            let over = btnNum > turnPageBarBtnNum+2
            let showBtnNum = over ? turnPageBarBtnNum : btnNum
            let prevBtn, pageBtn, nextBtn
            let prevBtnW, btnW, btnH, showBarW, barW
            turnBar = new createjs.Container()
            let btnBar = new createjs.Container()
            turnBar.name = 'turnBar'
            turnBar.addChild(btnBar)
            for(let i=0; i<btnNum; i++){
                pageBtn = self.createMC(obj.turn);
                if(!btnW){
                    btnW = pageBtn.nominalBounds.width+3
                    btnH = pageBtn.nominalBounds.height
                } 
                self.mcToBtn(pageBtn, btnClick)
                pageBtn.x = i*btnW
                pageBtn.tf.text = ''+(i+1)
                btnBar.addChild(pageBtn)
            }
            barW = btnW*btnNum
            showBarW = btnW*showBtnNum 
            if(over){
                prevBtn = self.createMC(obj.prev)
                prevBtn.y = (pageBtn.nominalBounds.height - prevBtn.nominalBounds.height)/2
                self.mcToBtn(prevBtn, prevBtnClick)
                prevBtnW = prevBtn.nominalBounds.width+4
                turnBar.addChild(prevBtn)
                
                nextBtn = self.createMC(obj.next)
                self.mcToBtn(nextBtn, nextBtnClick)
                nextBtn.x = prevBtnW+showBarW+2
                nextBtn.y = prevBtn.y
                turnBar.addChild(nextBtn)

                btnBar.x = prevBtnW+2

                let btnBarMask = new createjs.Shape()
                btnBarMask.x = btnBar.x
                btnBarMask.y = btnBar.y
                btnBarMask.graphics.beginFill("#ff0000").drawRect(-2, -2, showBarW, btnH+2)
                btnBar.mask = btnBarMask

                showBarW += prevBtnW*2
            }
            turnBar.y = itemH*pageItemNum+10
            turnBar.x = (holder.nominalBounds.width - showBarW)/2
            holder.addChild(turnBar)
            selectItem(btnBar.getChildAt(0))

            function btnClick(e){
                selectItem(e)
                let index = parseInt(e.tf.text)-1
                createItem(index)
            }
            function prevBtnClick(e){
                btnBar.x += btnW
                if(btnBar.x >= prevBtnW+2){
                    btnBar.x = prevBtnW+2
                }
            }
            function nextBtnClick(e){
                btnBar.x -= btnW
                if(barW+btnBar.x <= showBarW-prevBtnW){
                    btnBar.x = (showBarW-prevBtnW)-barW
                }
            }
            function selectItem(item){
                let btn
                for(let i=0; i<btnBar.numChildren; i++){
                    btn = btnBar.getChildAt(i)
                    if(btn == item){
                        self.enableMc(btn, false, true)
                    }else{
                        self.enableMc(btn, true, true)
                    }
                }
            }
        }
        return true
    }


    /** 把MC转成Btn */
    self.mcToBtn = (mc, fun)=>{
        new createjs.ButtonHelper(mc, 0, 1, 2);
        if(fun){
            mc.on('click', ()=>{ fun(mc) })
        }
    }

    /** 设置文本到按钮 */
    self.textToBtn = (tf, c0, c1, c2, fun)=>{
        if(tf.cursor != 'pointer'){
            tf.on('mouseover', ()=>{ tf.color = c0 })
            tf.on('mouseout', ()=>{tf.color = c1 })
            tf.on('mousedown', ()=>{tf.color = c2 })
            tf.on('pressup', ()=>{tf.color = c1; if(fun) fun(tf) })
            tf.cursor = 'pointer'
        }
        var shape = new createjs.Shape();
        shape.y = -5
        shape.graphics.beginFill("#ff0000").drawRect(0, 0, tf.getMeasuredWidth(), tf.lineHeight);
        tf.hitArea = shape
    }
    

    /** 把一个MC缓存为bitmap */
    self.cacheMc = (mc)=>{
        let w = mc.nominalBounds.width;
        let h = mc.nominalBounds.height;
        mc.cache(0, 0, w, h);
    }

    /** 取消一个MC的bitmap缓存 */
    self.uncacheMc = (mc)=>{
        mc.uncache();
    }

    self.enableMc = (mc, b, isAlpha)=>{
        mc.mouseEnabled = b
        mc.mouseChildren = false
        if(isAlpha) mc.alpha = b ? 1 : 0.3
    }

    /** 设置一个MC，使其变得可以手动。
     * @param mc 要拖动的影片剪辑实例。
     * @param isDragTop 拖动的实例是否放到最上层，默认值为：true
     * @param isY 是否在Y方向上移动，默认值为：true*/
    self.dragMC = (mc, isDragTop=false, isY=true, cursor=true)=> {
        if(!mc) return;
        if(cursor) mc.cursor = 'pointer';
        var isMove = false;
        mc.gotoAndStop(0);
        mc.addEventListener("mousedown", downHandler);
        mc.addEventListener("pressmove", moveHandler);
        mc.addEventListener("pressup", upHandler);
        function downHandler(e) {
            isMove = false;
            mc.dragOldX = e.localX;
            mc.dragOldY = e.localY;
            if(isDragTop) mc.parent.addChild(mc);
        };
        function moveHandler(e) {
            mc.x += (e.localX - mc.dragOldX)*mc.scaleX;
            if(isY) mc.y += (e.localY - mc.dragOldY)*mc.scaleY;
            mc.dragOldX = e.localX;
            mc.dragOldY = e.localY;
            if(isMove == false){
                isMove = true;
                mc.dispatchEvent(new createjs.Event("dragStart", false, false));
            }
            mc.dispatchEvent(new createjs.Event("drag", false, false));
        };
        function upHandler(e) {
            if(isMove == true){
                if(mc.currentLabel == "drag") mc.gotoAndStop(0);
                mc.dispatchEvent(new createjs.Event("dragEnd", false, false));
            }
        };
    }

    /** 停止一个MC的拖动。
     * @param mc 要停止拖动的影片剪辑实例。
     * @param isDragEndEvnet 是否处发结束拖动事件，默认值为：true */
    self.stopDragMC = (mc, isDragEndEvnet)=>{
        if (isDragEndEvnet === void 0) { isDragEndEvnet = true; }
        mc.removeAllEventListeners("mousedown");
        mc.removeAllEventListeners("pressmove");
        mc.removeAllEventListeners("pressup");
        if(isDragEndEvnet) mc.dispatchEvent(new createjs.Event("dragEnd", false, false));
    }

    /** 判断一个点，是否跟一个对象碰撞，假如hitObj存在，则用hitObj的位置与宽高来判断。
     * item 要碰撞的对象。
     * sx 本地X坐标（e.localX）。
     * sy 本地y坐标（e.localY）。*/
    self.hitTest = (item, sx, sy)=>{
        if(!item.nominalBounds) return;
        var rx = stage.scaleX;
        var ry = stage.scaleY;
        sx = sx*rx;
        sy = sy*ry;
        var w = item.nominalBounds.width;
        var h = item.nominalBounds.height;
        var p = item.parent.localToGlobal(item.x, item.y);
        if(item.hitObj){
            p.x = p.x+(item.hitObj.x-item.hitObj.regX)*rx-item.regX*rx;
            p.y = p.y+(item.hitObj.y-item.hitObj.regY)*ry-item.regY*ry;
            w = item.hitObj.nominalBounds.width;
            h = item.hitObj.nominalBounds.height;
        }else{
            p.x = p.x-item.regX*rx;
            p.y = p.y-item.regY*ry;
        }
        var r = new createjs.Rectangle(p.x, p.y, w*rx, h*ry);
        return r.contains(sx, sy);
    }

    /** 判断两个对象是否相碰，通过全局坐标来判断，假如hitObj存在，则用hitObj的位置与宽高来判断 */
    self.hitTestObj = (item0, item1)=>{
        var rx = stage.scaleX;
        var ry = stage.scaleY;
        var w0 = item0.nominalBounds.width;
        var h0 = item0.nominalBounds.height;
        var p0 = item0.parent.localToGlobal(item0.x, item0.y);
        var w1 = item1.nominalBounds.width;
        var h1 = item1.nominalBounds.height;
        var p1 = item1.parent.localToGlobal(item1.x, item1.y);
        if(item0.hitObj){
            p0.x = p0.x+(item0.hitObj.x-item0.hitObj.regX)*rx-item0.regX*rx;
            p0.y = p0.y+(item0.hitObj.y-item0.hitObj.regY)*ry-item0.regY*ry;
            w0 = item0.hitObj.nominalBounds.width;
            h0 = item0.hitObj.nominalBounds.height;
        }else{
            p0.x = p0.x-item0.regX*rx;
            p0.y = p0.y-item0.regY*ry;
        }
        if(item1.hitObj){
            p1.x = p1.x+(item1.hitObj.x-item1.hitObj.regX)*rx-item1.regX*rx;
            p1.y = p1.y+(item1.hitObj.y-item1.hitObj.regY)*ry-item1.regY*ry;
            w1 = item1.hitObj.nominalBounds.width;
            h1 = item1.hitObj.nominalBounds.height;
        }else{
            p1.x = p1.x-item1.regX*rx;
            p1.y = p1.y-item1.regY*ry;
        }
        var r0 = new createjs.Rectangle(p0.x, p0.y, w0*rx, h0*ry);
        var r1 = new createjs.Rectangle(p1.x, p1.y, w1*rx, h1*ry);
        return r0.intersects(r1);
    }

    /** 创建(new)一个库中的实例， 并作为MovieClip类型返回。 
     @param name 要获取的库中的定义。
     @param isCache 是否缓存为位图，默认值为false */
     self.createMC = (name, isCache=false)=>{
        if(name == undefined || name == null) return undefined;
        name = name.replace(/ /ig, "");
        if(name == "" || !lib[name]) return undefined;
        let mc = new lib[name]();
        mc.width = mc.nominalBounds.width;
        mc.height = mc.nominalBounds.height;
        if(isCache) mc.cache(0, 0, mc.width, mc.height);
        return mc;
    }

    /** 获取一个Shape */
    self.getShape = (w, h, color='#ffffff', alpha=1)=>{
        var shape = new createjs.Shape();
        shape.graphics.beginFill(colorToRGBA(color, alpha)).drawRect(0, 0, w, h)
        return shape
    }

    /** 复制文本到剪贴板中 */
    self.copyToClipboard = (text)=> {
        const input = document.createElement('input');
        input.setAttribute('value', text);
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    }

    /** 获取URL传来的参数 */
    self.getUrlParams = ()=>{
        var params = {};
        var arr = window.location.search.substring(1).split("&");
        var a;
        for (var i=0;i<arr.length;i++) {
            a = arr[i].split("=");
            params[a[0]] = a[1]; 
        }
        return params;
    }
})()