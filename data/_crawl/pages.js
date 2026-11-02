let gotoPageParams={
    action:'',
    method:'get',
    params:[],
    init:function (){
        this.action='';
        this.method='get';
        this.params=[];
    }
};
// Paging Query by pageIndex
// _data  is json data
function onGotoPage(){
    var _form = $('<form></form>');
    _form.attr('action',gotoPageParams.action);
    _form.attr('method',gotoPageParams.method);
    if(gotoPageParams.params && gotoPageParams.params.length>0){
        $.each(gotoPageParams.params,function (i,ele){
            _form.append($('<input type=\"hidden\" name=\"'+ele.name+'\" value=\"'+ele.value+'\" />'));
        });
    }
    $(document.body).append(_form);
    console.log('onGotoPage _form-->'+_form.html());
    console.log('onGotoPage _form.submit()');
    _form.submit();
}

String.prototype.startWith=function (str){
    let reg = new RegExp("^"+str);
    return reg.test(this);
}

// 需要在页面内自定义方实现跳转到指定页码：onJumpSpeciPage(_actionUrl,_flag,_isHtml)
// 在该方法内可以设置要传递的自定义参数
// _actionUrl:要调转的url
// _flag：1=指定跳转页码标志位，其它值为普通跳转
// _isHtml：变量isHtml的值
function onJumpSpeciPage(callback,_actionUrl,_flag,_isHtml){
    if(_actionUrl){
        if(_actionUrl.startWith("javascript:void(0);")){
            return;
        }
        gotoPageParams.init();
        var _url = _actionUrl;
        if(_flag && _flag==1){
            var _pageIndex = $("#Page_input").val();
            if (_pageIndex==undefined || _pageIndex==null || _pageIndex.trim()==""){
                alert('请输入要跳转的页码');
                return;
            }else{
                if(!(/(^[1-9]\d*$)/.test(_pageIndex))){
                    alert('请输入正确的页码');
                    return;
                }
            }
            _url= _actionUrl+ ((_pageIndex == 1) ? "" : ("_" + _pageIndex)) + (_isHtml? ".html" : "") ;
        }

        gotoPageParams.action = _url;
        gotoPageParams.method = 'get';

        if(typeof eval(callback) == 'function'){
            callback();// 执行回调函数
        }
        onGotoPage();
    }

}

// 默认的回调函数
function onCallbackPageParams(){}