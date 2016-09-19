/******************************************************************************
 *                                                                            *
 *  Copyright (C) 2014 Alexander Barth <barth.alexander@gmail.com>.           *
 *                                                                            *
 *  This program is free software: you can redistribute it and/or modify      *
 *  it under the terms of the GNU Affero General Public License as published  *
 *  by the Free Software Foundation, either version 3 of the License, or      *
 *  (at your option) any later version.                                       *
 *                                                                            *
 *  This program is distributed in the hope that it will be useful,           *
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of            *
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the             *
 *  GNU Affero General Public License for more details.                       *
 *                                                                            *
 *  You should have received a copy of the GNU Affero General Public License  *
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.     *
 *                                                                            *
 ******************************************************************************/

"use strict";

// SymbolSet defines a set of symbole such as notes or rest markers

function SymbolSet(type,list,range,translate,options) {
    var svg, elem, i;
    this.type = type;
    this.range = range;
    this.translate = translate;
    options = options || {};
    var n0 = options.n0 || 0;
    var n1 = options.n1 || 0;
    var xoffset = options.xoffset || 0;
    var that = this;
    this.n0 = n0;
    this.n1 = n1;
    this.list = list;
    this.xoffset = xoffset;

    for (var i=0; i < range.length; i++) {
        svg = document.createElementNS(xmlns,'svg');
        svg.setAttribute('width',30);
        svg.setAttribute('height',30);
        svg.setAttribute('class','ui-image');
        elem = document.createElementNS(xmlns,'use');
        elem.setAttributeNS(xlinkns,'href','#' + type + '_' + range[i]);
        elem.setAttribute('transform',this.translate);
        svg.appendChild(elem);
        document.getElementById('select_rest').appendChild(svg);
    }


    // markers in notation area
        for (var i = 0; i < 30; i++) {
            for (var n = n0; n <= n1; n++) {
                var elem = document.createElementNS(xmlns,'use');
                elem.setAttributeNS(xlinkns,'href','#' + type + '_marker');
                
                elem.setAttribute('class',type + '_marker');
                elem.setAttribute('x',x_start + dx*(i + xoffset));

                if (type === 'note') {
                    elem.setAttribute('y',y_start - dy*n);
                }
                
                //elem.setAttribute('width',note_marker_width);
                //elem.setAttribute('height',note_marker_height);

                // only used for notes
                elem.setAttribute('data-pos',n);
                elem.setAttribute('id',type + '_marker' + (i+xoffset) + '-' + n);
                elem.onclick = function(ev) { 
                  
                  that.click(ev.target); 
                  //that.click(ev.target.correspondingUseElement); 
                  
                  };
                document.getElementById(type + "_marks_layer").appendChild(elem);
            }
        }


// document.querySelector('#note_marks_layer').style.display = 'none'
}


// click on ui-image on top
SymbolSet.prototype.selected = function() {
    
};


// click on marker in notation area
SymbolSet.prototype.click = function(marker) {
    var duration = null, n = null;

    var x = marker.x.baseVal.value;
    var i = (x-x_start)/dx;
    var pos = marker.getAttribute('data-pos');
    var attr = 'data-' + this.type;

    if (marker.hasAttribute(attr)) {
        // remove 
        var uid = parseInt(marker.getAttribute(attr));
        this.remove(uid);
        marker.removeAttribute(attr);
    }
    else {
        var sel = document.querySelector('.selected').firstChild.href.baseVal.replace('#','').split('_',2);
        var set = sel[0];
        var what = sel[1];
        if (set !== this.type) {
            alert('cannot have a this here');
            return;
        }

        // duration for notes and rests
        if (this.type === 'note' || this.type === 'rest') {
            var baseinvduration = parseFloat(sel[1]);
            var ndots = parseInt(document.getElementById('extra_duration').value);
            duration = 1./baseinvduration * (2-Math.exp(-ndots*Math.log(2)));
        }

        // frequency for notes
        if (this.type === 'note') {
            var accidental = $('input[name=add_type]:checked', '#add_form').val();
            //var y = marker.y.baseVal.value;        
            //n = pos2nota(y,accidental === 'sharp');
            var pos = parseInt(marker.getAttribute('data-pos'),10);
            n = position2nota(pos,accidental === 'sharp')


            if (n === undefined) {
                console.log('does not exist');
                return;
            }            
        }


        this.add(i,{what: what, duration: duration, /*n: n,*/ accidental: accidental, position: pos});
    }    
};

SymbolSet.prototype.add = function(i,options) {
    var elem;
    options = options || {};
    var type = options.what;
    uniqueid ++;  

    var classname = 'class-' + uniqueid;
    elem = document.createElementNS(xmlns,'use')
    elem.setAttributeNS(xlinkns,'href','#' + this.type + '_' + type)
    elem.setAttribute('id',type + '-' + uniqueid);
    elem.setAttribute('class',classname);
    elem.setAttribute('x',x_start + i*dx);
    document.getElementById(this.type + "_marks_layer").appendChild(elem);    

    var marker = document.getElementById(this.type + '_marker' + i + '-0');
    if (marker) {
        // let the marker know that there is a line
        marker.setAttribute('data-' + this.type,uniqueid);            
    }

    if (this.n0 === this.n1) {
        if (this.type === 'rest') {
            this.list[i+this.xoffset] = {type: this.type, duration: 1/parseFloat(type), id: uniqueid};
        }
        else {
            this.list[i+this.xoffset] = {type: type, id: uniqueid};
        }
    }
};

SymbolSet.prototype.remove = function(uid) {
    var i;
    var elems = document.querySelectorAll('.class-' + uid);
    for (i = 0; i < elems.length; i++) {
        elems[i].parentNode.removeChild(elems[i]);
    }
    
    for (i = 0; i < this.list.length; i++) {
        if (this.list[i] !== undefined) {
            if (!(this.list[i] instanceof Array)) {
            //if (this.n0 === this.n1) {
                // every element of this.list is a scalar
                if (this.list[i].id === uid) {
                    this.list[i] = undefined;
                }
            }
            else {
                // every element of this.list is a list 
                this.list[i] = this.list[i].filter(function(n) {
                    return n.id !== uid;
                });
                
            }
        }
    }    

};

// remove all
SymbolSet.prototype.clear = function() {
    var i, l, n;

    for (i = 0; i < this.list.length; i++) {
        if (this.n0 === this.n1) {
            l = this.list[i];
            if (l) {
                this.remove(l.id);
            }
        }
        else {
            n = this.list[i][0];
            while (n) {
                this.remove(n.id);
                n = this.list[i][0];
            }
        }
    }
};
