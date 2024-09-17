declare interface Window {
    utils: {
        
         /** 向父级发送一个消息对象
         * @param obj 消息对象：{oper:'login', param:{naem:'wsl', pwd:'123456'}}
         * @param isLoading 是否显示加载动画
         * @param isCircle 是否显示转圈,就是有屏蔽操作，但是没有加载效果 */
        sendMsgToParent: (obj:any, isLoading=true, isCircle=true)=>{},

         /** 创建弹出一个面板实例
         * @param mc 要弹出的面板实例
         * @param x 面板的X位置，-1表示居中
         * @param y 面板的Y位置，-1表示居中
         * @param alpha 背景层的透明度
         * @param offsetY 弹出内容在Y轴上的偏移量
         * @param bgClickFun 点击背景的回调
         * @param bgColor 背景的颜色 */
        popupPanel:(mc:any, x=-1, y=-1, alpha=0.3, offsetY=0, bgClickFun=null, bgColor='#000000')=>{},

        /** 把一个MC缓存为bitmap
         * @param mc 要缓存的MC */
        cacheMc:(mc:string)=>{},
    
        /** 取消一个MC的bitmap缓存
         * @param mc 要解除缓存的MC */
        uncacheMc:(mc:string)=>{},
    
        /** 设置一个MC，使其变得可以手动。
         * @param mc 要拖动的影片剪辑实例。
         * @param isDragTop 拖动的实例是否放到最上层，默认值为：true
         * @param isY 是否在Y方向上移动，默认值为：true*/
        dragMC:(mc:string, isDragTop=false, isY=true, cursor=true)=> {},
    
        /** 停止一个MC的拖动。
         * @param mc 要停止拖动的影片剪辑实例。
         * @param isDragEndEvnet 是否处发结束拖动事件，默认值为：true */
        stopDragMC:(mc:string, isDragEndEvnet=true)=>{},
    
        /** 判断一个点，是否跟一个对象碰撞，假如hitObj存在，则用hitObj的位置与宽高来判断。
         * @param item 要碰撞的对象。
         * @param sx 本地X坐标（e.localX）。
         * @param sy 本地y坐标（e.localY）。*/
        hitTest:(item:any, sx:number, sy:number)=>{},
    
        /** 判断两个对象是否相碰，通过全局坐标来判断，假如hitObj存在，则用hitObj的位置与宽高来判断 */
        hitTestObj:(item0:any, item1:nay)=>{},
    
        /** 创建(new)一个库中的实例， 并作为MovieClip类型返回。 
         @param name 要获取的库中的定义。
         @param isCache 是否缓存为位图 */
         createMC:(name:string, isCache=false)=>{}
    }
}