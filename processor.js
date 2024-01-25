const fs = require('node:fs');
const path = require('node:path');
const {parse:xml,Node} = require('./xml');
const { inspect } = require('node:util');

const ROOT = path.join(__dirname,'cours');

function Cours (...args) {
    if (!(this instanceof Cours)) return new Cours(...args);

    let [params] = args;
    params ??= {};

    /** Should be an array of files (and possibly location) of declarations of the subject */
    this.contributes = [...(Array.isArray(params?.contributes) ? params?.contributes : [])].concat([...(Array.isArray(params?.contributes)||!params?.contributes ? [] : [params?.contributes])]);
    
    this.name = params?.name;
    this.id = params?.id;

    this.body = [];

    return this;
}

function Chapitre (...args) {
    if (!(this instanceof Chapitre)) return new Chapitre(...args);

    let [params] = args;
    params ??= {};

    /** Should be an array of files (and possibly location) of declarations of the chapter */
    this.contributes = [...(Array.isArray(params?.contributes) ? params?.contributes : [])].concat([...(Array.isArray(params?.contributes)||!params?.contributes ? [] : [params?.contributes])]);

    this.id = params?.id;
    this.title = params?.title;
    this.key = params?.key;

    this.body = params?.body??[];

    return this;
}

function Partie (...args) {
    if (!(this instanceof Partie)) return new Partie(...args);

    let [params] = args;
    params ??= {};

    this.contributes = [...(Array.isArray(params?.contributes) ? params?.contributes : [])].concat([...(Array.isArray(params?.contributes)||!params?.contributes ? [] : [params?.contributes])]);

    this.key = params?.key;
    this.id = params?.id;
    this.title = params?.title;

    this.body = params?.body??[];

    return this;
}

function Paragraphe (...args) {
    if (!(this instanceof Paragraphe)) return new Paragraphe(...args);

    let [params] = args;
    params ??= {};

    this.origin = params?.origin??['null',-1,-1];
    this.content = params?.content??null;

    return this;
}

function Definition (...args) {
    if (!(this instanceof Definition)) return new Definition(...args);

    let [params] = args;
    params ??= {};

    this.origin = params?.origin??['null',-1,-1];
    this.name = params?.name??null;
    this.content = params?.content??null;

    return this;
}

function AFaire (...args) {
    if (!(this instanceof AFaire)) return new AFaire(...args);

    let [params] = args;
    params ??= {};

    this.origin = params?.origin??['null',-1,-1];
    this.content = params?.content??null;

    return this;
}

function Exemple (...args) {
    if (!(this instanceof Exemple)) return new Exemple(...args);

    let [params] = args;
    params ??= {};

    this.contributes = [...(Array.isArray(params?.contributes) ? params?.contributes : [])].concat([...(Array.isArray(params?.contributes)||!params?.contributes ? [] : [params?.contributes])]);

    this.body = params?.body??[];

    return this;
}

function Introduction (...args) {
    if (!(this instanceof Introduction)) return new Introduction(...args);

    let [params] = args;
    params ??= {};

    this.origin = params?.origin??['null',-1,-1];
    this.content = params?.content??null;

    return this;
}

function Problematique (...args) {
    if (!(this instanceof Problematique)) return new Problematique(...args);

    let [params] = args;
    params ??= {};

    this.origin = params?.origin??['null',-1,-1];
    this.content = params?.content??null;
    this.key = params?.key??null;

    return this;
}

/** @type {Object<string,Cours>} */
const cours = {};

function processFile(data) {

    let process_text = (node) => {
        return node.children;
    }

    let extract_text = (node) => {
        if (node?.tag == '#TEXT') return node.text;
        return (node instanceof Node ? node?.children??[] : node?.body??[]).map(n=>extract_text(n)).join('');
    }

    /** @param {Node} root */
    let proces_node = (root,scope) => {

        for (let node of root.children??[]) if (node.tag != '#TEXT') {

            let new_scope = scope;

            if (node.tag == 'cours') {
                cours[node?.properties.id]??=Cours({
                    id: node?.properties.id,
                    name: node?.properties.nom??node?.properties.id,
                    contributes:[[node.file,node.line,node.column]],
                });
                new_scope = cours[node?.properties.id];
                //let c = cours[node?.properties.id];
            }

            else if (node.tag == 'chap') {
                let [subject,ci] = node.properties?.id.split(/-/g)??[];
                if (!cours[subject]) throw new Error(`ERROR: ${node.file}:${node.line}:${node.column} : Unknown subject \`${subject}\``);
                let c = cours[subject];
                let chap = c.body.find(e=>e instanceof Chapitre && e.id == node?.properties.id);
                if (!chap) {
                    chap = Chapitre({
                        id: node?.properties.id,
                        key: node?.properties.key??ci,
                        title: node?.properties.titre,
                        contributes:[[node.file,node.line,node.column]],
                    });
                    c.body.push(chap);
                }
                new_scope = chap;
            }
            
            else if (node.tag == 'p' || node.tag == 'important' || node.tag == 'bilan') {
                scope.body.push(Paragraphe({
                    origin:[node.file,node.line,node.column],
                    content: process_text(node)
                }));
            }

            else if (node.tag == 'pt') {
                let [subject,ci,...pt] = node.properties?.id.split(/-/g)??[];
                if (!cours?.[subject]) throw new Error(`ERROR: ${node.file}:${node.line}:${node.column} : Unknown subject \`${subject}\``);
                let chapter = cours?.[subject].body.find(el=>el instanceof Chapitre && el.id==subject+'-'+ci);
                if (!chapter) throw new Error(`ERROR: ${node.file}:${node.line}:${node.column} : Unknown chapter \`${ci}\` in \`${subject}\``);
                let n = chapter;
                let p = pt.pop();
                let pr = [];
                for (let p of pt) {
                    pr.push(p);
                    let nn = n?.body.find(el=>el.id==[subject,ci,...pr].join('-'));
                    if (!nn) throw new Error(`ERROR: ${node.file}:${node.line}:${node.column} : Unknown subpart \`${p}\` in \`${subject}\`, chapter \`${ci}\`, part \`${pr.join('/')}\``);
                    n = nn;
                }
                let part = n.body.find(el=>el instanceof Partie && el.id==node.properties?.id);
                if (!part) {
                    part = Partie({
                        id: node?.properties.id,
                        key: node?.properties.key??p,
                        title: node?.properties.titre,
                        contributes:[[node.file,node.line,node.column]],
                    });
                    n.body.push(part);
                }
                new_scope /*= cours[subject].chapitres[ci].parties[node.properties.id.split(/-/g).slice(2).join('-')]*/ = part;
            }

            else if (node.tag == 'def') {
                scope.body.push(Definition({
                    origin:[node.file,node.line,node.column],
                    name: node?.properties.nom,
                    content: process_text(node)
                }));
            }

            else if (node.tag == 'TODO') {
                console.log(`TODO @ ${node.file}:${node.line}:${node.column}: `+extract_text(node).replace(/\n\s+/g,' '));
                scope.body.push(AFaire({
                    origin:[node.file,node.line,node.column],
                    content: process_text(node)
                }));
            }

            else if (node.tag == 'exemple') {
                scope.body.push(Exemple({
                    origin:[node.file,node.line,node.column],
                }));
            }

            else if (node.tag == 'intro') {
                scope.body.push(Introduction({
                    origin:[node.file,node.line,node.column],
                    content: process_text(node)
                }));
            }

            else if (node.tag == 'pb') {
                scope.body.push(Problematique({
                    origin:[node.file,node.line,node.column],
                    content: process_text(node),
                    key:node.properties.key
                }));
            }

            else
                throw new Error(`ERROR: ${node.file}:${node.line}:${node.column} : Unsupported node type \`${node.tag}\``);

            if ((node.tag == 'cours' || node.tag == 'chap' || node.tag == 'pt' | node.tag == 'exemple') & Array.isArray(node?.children)) proces_node(node,new_scope);
            
        }

    }

    proces_node(data,null);

    /*let process_node = (node) => {

        for (let [name,data] of Object.entries(node)) if (name != '$') {

            let meta = typeof data == 'object' ? data.$??{} : {};

            console.log(name,meta,data);

            if (name == 'cours') {
                cours[meta.id]??=Cours({
                    id: meta.id
                });
                let c = cours[meta.id];
            }

            else if (name == 'chap') {
                let [subject,ci] = meta?.id.split(/-/g)??[];
                if (!cours[subject]) throw `Undefined subject ${subject}`;
                let c = cours[subject];
                c.chapitres[ci]??=Chapitre({
                    id: meta.id,
                    key: ci,
                    title: meta.titre
                });
            }

            process_node(data);

        }

    }

    process_node(data);*/

}

function explore( fp ) {
    return new Promise(async(resolve,reject)=>{

        fs.readdir(fp,{withFileTypes:true},(err,files)=>{

            if (err) return;

            resolve( Promise.all( files.map( file => {

                const filepath = path.join(file.path,file.name);

                if (file.isDirectory()) return explore(filepath);

                return new Promise((res,rej)=>{
                    fs.readFile(filepath,(err,content)=>{
                        
                        if (err) return rej(err);

                        res(processFile(xml(content,{fileName:filepath})));

                    });
                });

            } ) ) );

        });

    });
}

explore(ROOT).then(()=>{
    fs.rmSync('./output',{recursive:true,force:true});
    for (let [name,c] of Object.entries(cours)) {
        
        let root = path.join('./output',name);

        fs.mkdirSync(root,{recursive:true});

        /** @return {Chapitre[]} */
        let get_chapters = (node) => {
            if (node instanceof Chapitre) return node;
            return (node?.body??[]).map(n=>get_chapters(n)).flat().filter(n=>n);
        }

        /** @return {Partie[]} */
        let get_parts = (node) => {
            if (node instanceof Partie) return node;
            return (node?.body??[]).map(n=>get_parts(n)).flat().filter(n=>n);
        }

        /** @return {Definition[]} */
        let get_defs = (node) => {
            if (node instanceof Definition) return node;
            return (node?.body??[]).map(n=>get_defs(n)).flat().filter(n=>n);
        }

        let chapters = get_chapters(c);

        let fmtparts_rec = (node,p={}) =>{
            p = Object.assign({s:0},p);
            let s = ' '.repeat(p?.s);
            return (
                `${s}<ul>\n`+
                `${node.body.filter(n=>n instanceof Partie).map(n=>`${s} <li id="${n.id}">\n${s}  <a href="${n.id.split('-')[1]}.html#${n.id}">${n.key}&rpar; ${n.title}</a>\n${fmtparts_rec(n,{s:p.s+2})}\n${s} </li>\n`).join('')}${s}</ul>`
            );
        }

        fs.writeFileSync(
            path.join(root,'index.html'),
            `<!DOCTYPE html>\n`+
            `<!-- Auto-generated -->\n`+
            `<html>\n`+
            ` <head>\n`+
            `  <meta charset="utf-8"/>\n`+
            `  <title>Cours de ${c.name}</title>\n`+
            ` </head>\n`+
            ` <body>\n`+
            `  <div id="back"><a href="../index.html">Revenir à la liste des matières</a></div>\n`+
            `  <div id="chapitres">\n`+
            `   <h1>Cours de ${c.name}</h1>\n`+
            chapters.sort((a,b)=>(+a.id.split('-').at(-1))-(+b.id.split('-').at(-1))).map(c=>`    <div class="chapter" id="${c.id}">\n     <h2><a href="${c.id.split(/-/g)[1]}.html">${c.key} - ${c.title}</a></h2>\n${fmtparts_rec(c,{s:5})}\n    </div>\n`).join('')+
            `  </div>\n`+
            ` </body>\n`+
            `</html>\n`
        );

        let fmtpg_rec = (node,p={}) => {
            p = Object.assign({},{s:0},p);
            let s = ' '.repeat(p?.s);
            if (Array.isArray(node)) return node.map(n=>fmtpg_rec(n,{...p,s:(p?.s??0)+1})).join('');
            if (node.tag=='#TEXT') return `${s}${node.text}\n`;
            if (node.tag=='br') return `${s}<br>\n`;
            if (Array.isArray(node.children)) return `${s}<${node.tag}>\n${fmtpg_rec(node.children,{...p,s:(s?.p??0)+1})}${s}</${node.tag}>\n`;
            console.log('PG',node);
        }

        let fmtchap_rec = (node,p={}) => {
            p = Object.assign({},{s:0},p);
            let s = ' '.repeat(p?.s);
            if (node instanceof Paragraphe) return (
                `${s}<p>\n`+
                `${fmtpg_rec(node.content,p)}`+
                `${s}</p>\n`
            );
            if (node instanceof Partie) return (
                `${s}<div id="${node.id}" class="partie">\n`+
                `${s}<h2 class="partie-titre"><span class="partie-key">${node.key}</span> - <span class="partie-title">${node.title}</span><button class="permalink" link="${node.id}">🔗</button></h2>\n`+
                `${(node.body.map(n=>`${fmtchap_rec(n,{...p,s:p.s+1})}`)??[]).join('')}`+
                `${s}</div>\n`
            );
            if (node instanceof Chapitre) return (
                `${s}<div id="${node.id}" class="chapitre">\n`+
                `${(node.body.map(n=>`${fmtchap_rec(n,{...p,s:p.s+1})}`)??[]).join('')}`+
                `${s}</div>\n`
            );
            if (node instanceof Definition) return (
                `${s}<div class="definition">\n`+
                `${s} <div class="definition-nom">${node.name}</div><div class="definition-sep">: </div>\n`+
                `${s} <div class="definition-def">\n`+
                `${fmtpg_rec(node.content,{...p,s:(p?.s??0)+2})}`+
                `${s} </div>\n`+
                `${s}</div>\n`
            );
            if (node instanceof Introduction) return (
                `${s}<div class="introduction">\n`+
                `${s}<span class="introduction-intro">Introduction</span><span class="introduction-sep">: </span>\n`+
                `<span class="introduction-content">\n${s}${fmtpg_rec(node.content,p)}${s}</span>`+
                `${s}</div>\n`
            );
            if (node instanceof Introduction) return (
                `${s}<div class="problematique">\n`+
                `${s}<span class="problematique-intro">Problématique${node.key?' '+node.key:''}</span><span class="problematique-sep">: </span>\n`+
                `<span class="problematique-content">\n${s}${fmtpg_rec(node.content,p)}${s}</span>`+
                `${s}</div>\n`
            );
            if (node instanceof AFaire) return (
                `${s}<todo><span>Elément manquant: </span>\n${fmtpg_rec(node.content,{...p,s:(p?.s??0)+1})}${s}</todo>`
            );
            return (
                `${s}<unknown>Noeud inconnu &apos;${node.constructor.name}&quot;</unknown>\n`
            );
        }

        let proces_chap_rec = (node) => {
            for (let p of node?.body??[]) proces_chap_rec(p);
            if (!(node instanceof Chapitre)) return;
            let [subject_id,chapter_id] = node.id.split(/-/g);
            fs.writeFileSync(
                path.join(root,`${chapter_id}.html`),
                `<!DOCTYPE html>\n`+
                `<!-- Auto-generated -->\n`+
                `<html>\n`+
                ` <head>\n`+
                `  <meta charset="utf-8"/>\n`+
                `  <title>Cours de ${c.name}</title>\n`+
                `  <style>\n`+
                `   div[class="partie"] {\n`+
                `    margin-left:1em;\n`+
                `   }\n`+
                `   div[class="definition-nom"] {\n`+
                `    text-decoration:underline 1px red;\n`+
                `   }\n`+
                `   button[class="permalink"] {\n`+
                `    font-size:xx-small;\n`+
                `   }\n`+
                `   div[class="definition"] {\n`+
                `    display:flex;\n`+
                `    flex-wrap:nowrap;\n`+
                `   }\n`+
                `   div[class="definition-sep"] {\n`+
                `    margin-right:5px;\n`+
                `   }\n`+
                `   .partie-title {\n`+
                `    text-decoration: underline solid black 1px;\n`+
                `   }\n`+
                `   todo {\n`+
                `    color:red;\n`+
                `   }\n`+
                `   p {\n`+
                `    margin-left:.25em;\n`+
                `   }\n`+
                `  </style>\n`+
                ` </head>\n`+
                ` <body>\n`+
                `  <div id="back"><a href="index.html">Revenir à ${name}</a></div>\n`+
                `  <h1>Chapitre <span class="chapter-key">${node.key}</span>: <span class="chapter-title">${node.title}</span></h1>\n`+
                fmtchap_rec(node,{s:3})+
                `  <script>\n`+
                `   document.querySelectorAll('.permalink').forEach(\n`+
                `    l => {\n`+
                `     l.addEventListener('click', ev => {\n`+
                `      document.location.hash = '#'+encodeURIComponent(l.attributes.link.value);\n`+
                `     });\n`+
                `    }\n`+
                `   );\n`+
                `   let targetel = document.location.hash.length>1 ? document.querySelector(document.location.hash) : null;\n`+
                `   if (targetel) targetel.scrollIntoView();\n`+
                `  </script>\n`+ 
                ` </body>\n`+
                `</html>\n`
            );
        }

        proces_chap_rec(c);

        /** @param {Partie} node */
        /*let proces_part_rec = (node) => {
            for (let p of node?.body??[]) proces_part_rec(p);
            if (!(node instanceof Partie)) return;
            let [subject_id,chapter_id,...part_path] = node.id.split(/-/g);
            let part_root = path.join(root,chapter_id,...part_path);
            fs.mkdirSync(part_root,{recursive:true});
            fs.writeFileSync(
                path.join(part_root,'index.html'),
                `<!DOCTYPE html>\n`+
                `<!-- Auto-generated -->\n`+
                `<html>\n`+
                ` <head>\n`+
                `  <meta charset="utf-8"/>\n`+
                `  <title>Cours de ${c.name}</title>\n`+
                ` </head>\n`+
                ` <body>\n`+
                ` </body>\n`+
                `</html>\n`
            );
        }*/

    }
}).catch(err=>{
    throw err;
});