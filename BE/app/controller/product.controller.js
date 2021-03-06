var BannerPosit = require('../models/bannerposit.model')
var Auction = require('../models/auction.model')
var User = require('../models/user.model')
var Web = require('../models/web.model')
var CartController = require('../controller/cart.controller');

exports.findAllBySearchString = function(req,res){
    BannerPosit.findAllByString(req.body.searchString, function (respnse){
        if(respnse != null & respnse.length != 0){
            var ArrayList = new Array();
            var count = 0;
            respnse.forEach(element => {    
                Web.findOneById(element.web_id,function(result){
                    if(result!=null){
                        ArrayList.push(result);
                    }
                    count++;
                    if(count == respnse.length){
                        res.send({
                            BannerPosit: respnse,
                            WebInfo: ArrayList
                        });
                        return;
                    }
                })
            });         
        }
        else
            res.send('Khong tim thay ket qua');
    });
}

exports.findAllByName = function(req,res){
    BannerPosit.findAllByName(req.body.name, function (respnse){
        if(respnse != null || respnse.length != 0){
            var ArrayList = new Array();
            var count = 0;
            respnse.forEach(element => {    
                Web.findOneById(element.web_id,function(result){
                    if(result!=null){
                        ArrayList.push(result);
                    }
                    count++;
                    if(count == respnse.length){
                        res.send({
                            BannerPosit: respnse,
                            WebInfo: ArrayList
                        });
                        return;
                    }
                })
            });         
        }
        else
            res.send('Khong tim thay ket qua');
    });
}



exports.get_one_by_id = function (req, res) {
    BannerPosit.findOneById(req.params.id, function (respnse) {
        if (respnse != null) {
            //res.render(__dirname.replace('app\\controller','')+'views/items/product',{result:respnse});
            Auction.get_rank(req.params.id, function (result) {
                if (result == null) {
                    res.send({
                        BannerPosit: respnse,
                        rank: "Kh??ng c?? ai ?????u gi?? s???n ph???m n??y"
                    });
                } else {
                    var ArrayList = new Array();
                    var count = 0;
                    result.forEach(element => {
                        User.findOneById(element.userid,function(userInfo){
                            if(userInfo != null)
                                ArrayList.push(userInfo);                               
                            count++;
                            if(count == result.length){
                                res.send({
                                    BannerPosit: respnse,
                                    rank: result,
                                    UserInfo: ArrayList
                                });
                                return;
                            }
                        })
                    });
                }
            })
        } else res.send(respnse);
    })
}

//T???o m???i m???t BannerPosit => timeLive s??? m???c ?????nh set null
exports.create = function(req,res){
    var data = req.body;
    //Check xem ???? t???n t???i BannerPosit ch??a (??? ????y x??t tr??ng t??n v?? web_id)
    BannerPosit.checkExisted(data.name,data.web_id,function(respnse){
        // N???u ch??a c?? th?? th??m v??o ???????c
        if(respnse == null){
            BannerPosit.insert(data,function(respnse){        
                res.send('???? th??m th??nh c??ng BannerPosit c?? th??ng tin : '+ respnse);
            })
        }
        //N???u c?? th?? kh??ng th???c thi 
        else res.send('???? t???n t???i BannerPosit n??y');
    })
    
} 

exports.get_all = function(req,res){
    BannerPosit.findAll(function(respnse){     
        if(respnse != null | respnse.length != 0){
            var ArrayList = new Array();
            var count = 0;
            respnse.forEach(element => {    
                Web.findOneById(element.web_id,function(result){
                    if(result!=null){
                        ArrayList.push(result);
                    }
                    count++;
                    if(count == respnse.length){
                        res.send({
                            BannerPosit: respnse,
                            WebInfo: ArrayList
                        });
                        return;
                    }
                })
            });         
        }
        else res.send("ko c?? d??? li???u BannerPosit");
    })
} 


// Thay ?????i th??ng tin c???a s???n ph???m (n???u c???n) => truy???n v??o t???t c??? data mu???n thay ?????i
exports.changeInfo = function(req,res){
    var data = req.body;
    BannerPosit.update(data,function(respnse){
        res.send(respnse);
    })
}

//G???i ??i th???i gian ?????u gi??, th???i gian k???t th??c ?????u gi?? ,id c???a s???n ph???m => ????a s???n ph???m ra ?????u gi?? => sau th???i gian timeLive (th???i gian k???t th??c tr??? th???i gian ?????u gi??) 
//s??? ????a s???n ph???m v??o cart c???a ng?????i rank 1 ?????ng th???i set tr???ng th??i ?????u gi?? v??? 0 (ko ?????u gi??)
exports.moveBannerPositToAuction = function(req,res){
    var data = req.body;
    BannerPosit.findOneById(data.id,function(FindResult){
        if(FindResult != null){
            
            // if(data.timeLive == null ) {
            //     res.send('Th???i gian kh??ng h???p l???');
            // }
            FindResult.auction_status = 1;
            FindResult.price_step = parseFloat(data.price_step);

            d=new Date(data.auction_end_date)
            e=new Date(data.auctionTime)
            var timeLive = (d.getTime() - e.getTime());
            if(timeLive<=0){
                res.send('Th???i gian b??? sai !');
                return;
            }
            else{
                FindResult.timeLive = (timeLive/1000)/3600/24;
                FindResult.min_price = data.min_price;
                FindResult.last_auction_date = data.auctionTime;
                FindResult.auction_date = (data.auctionTime);
                FindResult.auction_end_date = data.auction_end_date;
                console.log(FindResult.auction_end_date);
                console.log(FindResult);
                BannerPosit.update(FindResult,function(respnse){
                    if(respnse != null){
                        //Sau th???i gian timeLive s??? th??m s???n ph???m v??o ng?????i c?? rank cao nh???t
                        var myVar = setInterval(function(){
                            CartController.add(FindResult.id)
                            //Sau khi add v??o gi??? h??ng ng?????i rank cao nh???t => set l???i auction_status = 0 ????? ko hi???n ?????u gi?? n???a
                            BannerPosit.findOneById(FindResult.id,function(result){
                                result.auction_status = 0
                                result.timeLive = 0;
                                setTimeout(() => {clearInterval(myVar);BannerPosit.update(result,function(updateStatus){
                                    console.log(updateStatus);
                                })}, 0); 
                            })                        
                        },timeLive);
                        //Sau khi thay ?????i tr???ng th??i ?????u gi?? th?? tr??? v??? d??ng msg nh???m k???t th??c request
                        // => c?? th??? ????a c??c s???n ph???m kh??c l??n ?????u gi?? 
                        res.send('???? ????a s???n ph???m l??n ?????u gi??')
                    }
                    else
                        res.send("Update status khong thanh cong");
                })
            }            
        }
        else res.send('L???i update BannerPosit')
    })
    
}

exports.remove = function(req,res){
    Auction.findOneByPositId(req.params.id,function(respnse){
        if(respnse != null){
            Auction.delete(respnse.id,function(data){
                    console.log(data);
            });
        }
        BannerPosit.delete(req.params.id,function(respnse){
            res.send({result:respnse});
        })
    }); 
}
