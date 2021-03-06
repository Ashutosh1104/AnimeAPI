var {rp} = require('./request');
var cheerio = require('cheerio');
var {Split,change,staffdetail,voiceactor}= require('./namemagic')



function getbyName(name,filter="anime"){
    return rp("https://www.anime-planet.com/"+filter+"/"+change(name)).then((data) => {
      const $ = cheerio.load(data);
          metadata={}
          metadata.name=$('h1[itemprop="name"]').text()
          metadata.img='https://www.anime-planet.com'+$('.mainEntry').children().attr('src')
          metadata.alternativeName=Split($('.aka').text(),': ')[1]
          deatils=$(".entryBar").eq(0).children()
          metadata.season={}
          if(filter=="anime"){
            metadata.type=Split(Split(deatils.eq(0).text(),'\n')[1],' (')[0]
            metadata.episodes=parseInt(Split(Split(Split(deatils.eq(0).text(),'\n')[1],' (')[1],'+')[0])
            metadata.season.time=Split(deatils.eq(2).children().eq(2).text(),' ')[0]
          }
          if(filter=="manga"){
            metadata.vol=parseInt(Split(Split(Split(deatils.eq(0).text(),'\n')[1],';')[0],':')[1])
            metadata.chapters=parseInt(Split(Split(Split(deatils.eq(0).text(),'\n')[1],';')[1],':')[1])
          }
          metadata.stuOrpub=Split(deatils.eq(1).text(),'\n')[1]
          metadata.season.start=parseInt($('span[itemprop="datePublished"]').text())
          x=Split(Split($('.iconYear').text(),'- ')[1],'')
            if(x[0]=='?'){metadata.season.end=x[0]}
            else{metadata.season.end=parseInt(x.slice(0,4).join(''))}
          metadata.rating=parseFloat(Split(deatils.eq(3).text(),' ')[0])   // out of 5
          metadata.rank=parseInt(Split(deatils.eq(4).text().replace(/,/g,''),'#')[1])
          metadata.plot=$('div[itemprop="description"]').text()
          metadata.source=Split($('.notes').text(),':')[1]
          metadata.tags=[]
          tags=$('.tags').children().eq(1).children().each(function(){
              metadata.tags.push($(this).text())
          })
      return metadata;
    }).catch(err=> console.log(err))
}

function getCharactersfor(name,filter='anime'){
    return rp("https://www.anime-planet.com/"+filter+"/"+change(name)+"/characters").then((data) => { 
        const $=cheerio.load(data)
        x=[]
        a=$("tr").each(function(){
            const character={name:undefined,image:undefined,voiceActors:{English:[],Japanese:[]}}
            character.name=$(this).find(".name").text()
            character.image="https://www.anime-planet.com"+$(this).find('.tableAvatar').find('img').attr('src')
            if(filter=='anime'){
                m=$(this).find(".flagUS").children().each(function(){
                   const res={name:'',image:undefined,otherworks:[]}
                   res.name=$(this).html()
                   a=cheerio.load($(this).attr('title'))
                   res.image="https://www.anime-planet.com"+a('img').attr('src')
                   res.otherworks=voiceactor(a)
                   character.voiceActors.English.push(res)
                })
                m=$(this).find(".flagJP").children().each(function(i){
                    const res={name:'',image:undefined,otherworks:[]}
                    res.name=$(this).html()
                    a=cheerio.load($(this).attr('title'))
                    res.image="https://www.anime-planet.com"+a('img').attr('src')
                    res.otherworks=voiceactor(a)
                    character.voiceActors.Japanese.push(res)
                })
            }else{
                character.voiceActors=undefined
            }
            x.push(character)
        })
        return(x)
    }).catch(err=> console.log(err))
}

function getStafffor(name,filter='anime'){
    return rp("https://www.anime-planet.com/"+filter+"/"+change(name)).then((data) =>{
        var $=cheerio.load(data)
        staff=[]
        members=$(".castaff").find(".cardGrid6").children().each(function(){
            member={name:'',image:'',field:'',otherworks:[]}
            a=$(this).find(".crop")
            member.name=$(a).next().text()
            member.image="https://www.anime-planet.com"+$(a).children().attr('data-src')
            member.field=$(this).find('.tooltip').next().html()
            var a=cheerio.load($(this).find('a').attr('title'))
            member.otherworks=staffdetail(a)
            staff.push(member)        
        })
        return staff 
    }).catch(err=> console.log(err))   
}

function getSimilarfor(name,filter="anime"){
    return rp("https://www.anime-planet.com/"+filter+"/"+change(name)+"/recommendations/"+filter).then((data) =>{
        var $=cheerio.load(data)
        similar=[]
        animes=$(".recEntry").each(function(){
            anime={}
            anime.name=$(this).find("img").attr("alt")
            anime.img="https://www.anime-planet.com"+$(this).find("img").attr("data-src")
            if(filter=="anime"){
                a=Split($(this).find(".type").text(),' (')
                anime.type=a[0]
                anime.episodes=parseInt(Split(a[1],')')[0])
            }
            if(filter=="manga"){
                a=Split($(this).find(".iconVol").text(),';')
                anime.Vol=parseInt(Split(a[0],': ')[1])
                if(a[1]){anime.chapters=parseInt(Split(a[0],': ')[1])}
                else{anime.chapters=a[1]}                
            }            
            anime.details=$(this).find(".sm-2-3").find('p').text()
            a=Split($(this).find(".iconYear").text(),'-')
            anime.run={}
            anime.run.from=parseInt(a[0])
            anime.run.to=parseInt(a[1])
            anime.tags=[]
            tag=$('.tags').children().eq(1).children().each(function(){
                anime.tags.push($(this).text())
            })
            similar.push(anime)
        })
        return similar 
    }).catch(err=> console.log(err))   
}

function getallbyName(name,filter='anime'){  
    return new Promise((resolve,reject)=>{
        Promise.all([getbyName(name,filter),getCharactersfor(name,filter),getStafffor(name,filter),getSimilarfor(name,filter)]).then((values)=>{
            anime={}
            anime.details=values[0]
            anime.characters=values[1]
            anime.staff=values[2]
            anime.similar=values[3]
            if(anime){resolve(anime)}
            else{reject(err=>console.log('Some problem in making page'))}
        })        
    }).catch(err=> console.log(err)) 
}

module.exports={
    getbyName,
    getCharactersfor,
    getStafffor,
    getallbyName,
    getSimilarfor
}




