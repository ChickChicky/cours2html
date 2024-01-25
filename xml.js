/**
 * Small library to parse basic XML files that just fits my neds
 */

/**
 * @class
 */
function Node(params={}) {
    if (!(this instanceof Node)) return new Node(params);

    /** 
     * @type {boolean} 
     * Whether this node is self-closing
     * 
     * Note: Values true for #TEXT nodes
     */
    this.closing = false;

    /** 
     * @type {string|null} 
     * The tag name of this node,
     * for `<a>...</a>` it would be `'a'`, 
     * and for raw text `Hello, world !`, it would be `#TEXT`
     */
    this.tag = null;

    /** 
     * @type {Object<string,string|boolean>}
     * The properties of the node,
     * `<a hello="world" idk/>`, it would be `{'hello':'world',idk:true}`
     */
    this.properties = {};

    /**
     * @type {Array<Node>}
     * The children of this node
     */
    this.children = [];

    /**
     * @type {Node|null}
     * The parent of this node
     */
    this.parent = null;

    /**
     * @type {string}
     * The text contents of this node
     */
    this.text = '';

    /**
     * @type {number}
     * The column where the tag was opened
     */
    this.column = -1;

    /**
     * @type {number}
     * The line where the tag was opened
     */
    this.line = -1;
        
    Object.assign(this,params??{});

    return this;
}

Node.prototype = {

    getNodeByTagName: function getNodeByTagName(tagName) {
        return this.children.find(n=>n.tag==tagName);
    },

    getNodesByTagName: function getNodesByTagName(tagName) {
        return this.children.filter(n=>n.tag==tagName);
    },

};

function parse( document, options={} ) {

    document = document.toString('utf-8').replace(/\r\n/g,'\n');
    options = Object.assign({
        useTextNode: true,
        keepRoot: true,
        fileName: '@input'
    },options);

    let tagbuff = ''; let tagdata = {}; let tagstate = 'tag'; let tagtmp = {};
    let ampbuff = '';
    /** @type {'buff'|'tagbuff'|'ampbuff'} */
    let state = 'buff';

    let root = Node({root:true});
    root.parent = root;

    let node = root;

    let lineno = 1;
    let colno = 0;

    for (let [c,i] of Array.from(document).map((c,i)=>[c,i])) {

        let save_text = () => {
            if (options.useTextNode && node.text.length) {
                node.children.push(Node({
                    file:options.fileName,column:tagdata.column,line:tagdata.line,
                    closing: true,
                    children: null,
                    parent: node,
                    properties: {},
                    tag: '#TEXT',
                    text: node.text
                }));
                node.text = '';
            }
        }

        colno++;
        if (c == '\n') {
            colno = 1;
            lineno++;
        }

        // console.log(i,c,{tagbuff,tagdata,tagstate,tagtmp})

        if (state == 'buff') {

            /*if (c == '&') {
                state = 'ampbuff';
                ampbuff = '';
                continue;
            }*/

            if (c == '<') {
                save_text();
                state = 'tagbuff';
                tagbuff = '';
                tagdata = {column:colno,line:lineno};
                tagstate = 'tag';
                continue;
            }

            node.text += c;
            tagdata.buff += c;

        }

        else if (state == 'tagbuff') {

            let handlesep = () => {
                if (tagstate == 'tag' && tagbuff.trim().length) {
                    tagdata.tag = tagbuff.trim();
                    tagstate = 'params';
                }
                tagbuff = '';
            }

            if (tagstate == 'params' || tagstate == 'tag') {
                if (c == '>') {
                    handlesep();
                    state = 'buff';
                    // console.log(tagdata);
                    if (!tagdata.close) {
                        let nnode = Node({file:options.fileName,column:tagdata.column,line:tagdata.line,tag:tagdata.tag??null,closing:tagdata.closing??false,properties:tagdata.params??{},parent:node});
                        node.children.push(nnode);
                        if (!tagdata.closing) node = nnode;
                    } else {
                        save_text();
                        node = node.parent;
                    }
                    continue;
                }
            }

            if ((tagstate == 'tag') && (c == ' ' || c == '\n')) {
                handlesep();
                continue;
            }

            if ((tagstate == 'tag') && (c == '/' && document[i-1] == '<')) {
                tagdata.close = true;
                continue;
            }

            if ((tagstate == 'tag' || tagstate == 'params') && (c == '/' && document[i+1] == '>')) {
                tagdata.closing = true;
                continue;
            }

            if (tagstate == 'params') {

                if (c == '=') {
                    tagtmp.param = tagbuff;
                    tagstate = 'value';
                    tagbuff = '';
                    continue;
                }

            }

            if (tagstate == 'value') {

                if (c == '"' && tagbuff.length > 0) {
                    tagstate = 'params';
                    tagdata.params??={};
                    tagdata.params[tagtmp.param.trim()] = tagbuff.slice(1,);
                    tagbuff = '';
                    continue;
                }

            }

            tagbuff += c;

        }

        /*else if (state == 'ampbuff') {

            if (c == ';') {
                buff += {
                    'lt': '<',
                    'gt': '>',
                    'amp': '&'
                }[ampbuff]??'';
                state = 'buff';
                continue;
            }

            ampbuff += c;

        }*/

    }

    if (node != root) {
        throw new Error('Unclosed root tag');
    }

    if (!options.keepRoot) {
        root = root.children[0];
        root.parent = root;
    }

    return root;

}

//console.dir(parse('<a b="c"><d f="ja" b="je"/>hello<e/></a>'),{depth:100});

module.exports = {parse,Node};