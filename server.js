
const http=require("http"),fs=require("fs"),path=require("path");
const PORT=process.env.PORT||10000;
const root=path.join(__dirname,"public");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
http.createServer((req,res)=>{
  let p=new URL(req.url,`http://${req.headers.host}`).pathname;
  if(p==="/health"){res.writeHead(200,{"Content-Type":"application/json"});return res.end(JSON.stringify({ok:true,service:"CivicFix"}))}
  if(p==="/api/health"){res.writeHead(200,{"Content-Type":"application/json"});return res.end(JSON.stringify({ok:true,service:"CivicFix"}))}
  if(p==="/")p="/index.html";
  const file=path.join(root,p);
  if(fs.existsSync(file)&&fs.statSync(file).isFile()){
    res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream","Cache-Control":p==="/index.html"?"no-store":"public,max-age=3600"});
    return res.end(fs.readFileSync(file));
  }
  const spa=path.join(root,"index.html");
  res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(fs.readFileSync(spa));
}).listen(PORT,"0.0.0.0",()=>console.log(`CivicFix listening on ${PORT}`));
