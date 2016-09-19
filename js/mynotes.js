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

var xlinkns = "http://www.w3.org/1999/xlink";
var xmlns = "http://www.w3.org/2000/svg";
var uniqueid = 0;
var dx = 50;
var dy = 10; // space between two half-tones
var dx_dots = 8; // space between two dots in a dotted note

var x_start = 120; // first note start at 30 pixels

var y_start = 6*dy; // sol is on 4th line from the top 
// 1st line  => y == 0
// 2nd line  => y == 2*dy
// 3rd line  => y == 4*dy
// 4th line  => y == 6*dy
// ...

// list of all notes including half-tones
var nota = [];

// notes of current tune
var notes = [];
// vertical line markers
var line_marker = [];
var rest_marker = [];

// list of all sound files as Audio elements
var sounds = [];

var note_marker_width = 10;
var note_marker_height = 10;

var modifiers = [];

var noteSet, restSet, lineSet;


// a note on a guitar is a string and a fret
// string=0 is Mi (lowest), 1 is La, 2 is Re, ...
function helper(gn) {
    var len = [5,5,5,4,5,Infinity]; 
    var s = gn.string;
    
    if (gn.fret >= len[s]) {
        return helper({string: s+1, fret: gn.fret-len[s]});
    }
    else {
        return gn;
    }
    
}

// n = 0 is E/Mi, n=1 is F/Fa, n=2 is F#/Fa#, ...
function note2guitarnote(n) {
    return helper({string: 0, fret: n});
}


function mod(n, m) {
    return ((m % n) + n) % n;
}



function pos2nota(y,ht) {
    for (var n = 0; n < nota.length; n++) {
        if (nota[n].pos === (y_start-y)/dy && nota[n].halfton === ht) {
            return n;
        }
    }
}

function position2nota(pos,ht) {
    for (var n = 0; n < nota.length; n++) {
        if (nota[n].pos === pos && nota[n].halfton === ht) {
            return n;
        }
    }
}

function frequency(notes,line_marker,i) {
    var note = notes[i];
    var n;

    n = position2nota(note.position,note.accidental === 'sharp');

    if (accidental === 'flat') {
        n = n-1;
    }
    
    return n;
}


function setup() {
    var elem;
    nota = [{pos: -9, halfton: false}];

    for (var i=0; i < 200; i++) {
        //console.log(nota[i]);
        if (nota[i].halfton || mod(7,nota[i].pos) === 5 || mod(7,nota[i].pos) === 2 ) {
            nota[i+1] = {pos: nota[i].pos+1, halfton: false};    
        }
        else {
            nota[i+1] = {pos: nota[i].pos, halfton: true};        
        }   
    }


}



// add a note at the i-th time and at frequency n

function add_note(i,options) {
    // add
    uniqueid ++;  
    var type = 'note';
    var n = options.n;
    var duration = options.duration;
    var position = options.position;
    var accidental = options.accidental || null;
    
    if (position === undefined && n !== undefined) {
        position = nota[n].pos;
        accidental = (nota[n].halfton ? 'sharp' : null);
    }

    if (position !== undefined && n === undefined) {
        n = position2nota(position,accidental === 'sharp');
        if (accidental === 'flat') {
            n = n-1;
        }
    }    

    if (notes[i] === undefined) {
        notes[i] = [];
    }
    notes[i].push({n: n, duration: duration, id: uniqueid, position: position, accidental: accidental});

    var baseinvduration = Math.pow(2,-Math.floor(Math.log(duration)/Math.log(2)));
    var ndots = Math.round(-Math.log(2 - duration*baseinvduration)/Math.log(2));

    console.log('baseinvduration',baseinvduration,'ndots',ndots);

    var classname = 'class-' + uniqueid;
    var x = x_start + dx*i;

    var nt = nota[n];
    var gn = note2guitarnote(n);
    var marker = document.getElementById('note_marker' + i + '-' + position);
    var y = y_start - dy*position;
    

    var elem = document.createElementNS(xmlns,'use')
    var id = 'note-' + uniqueid;

    //console.log('y',n,nt,y,yc); 

    // note

    elem.setAttributeNS(xlinkns,'href','#' + type + '_' + baseinvduration);
    elem.setAttribute('id',id);    
    elem.setAttribute('class',classname);
    elem.setAttribute('x',x);
    elem.setAttribute('y',y);
    document.getElementById("note_layer").appendChild(elem);

    if (accidental !== null) {
        // #
        //<use xlink:href="#sharp" y="0" />
        elem = document.createElementNS(xmlns,'use')
        elem.setAttributeNS(xlinkns,'href','#' + accidental)
        elem.setAttribute('id',accidental + '-' + uniqueid);
        elem.setAttribute('class',classname);
        elem.setAttribute('x',x);
        elem.setAttribute('y',y);
        document.getElementById("note_layer").appendChild(elem);
    }


    // helper line
    for (var yh = y_start + 4*dy; yh <= y; yh=yh+2*dy) {
        // <use xlink:href="#lineh" x="120" y="100"/>
        
        elem = document.createElementNS(xmlns,'use');
        elem.setAttributeNS(xlinkns,'href','#lineh');
        elem.setAttribute('class',classname);
        elem.setAttribute('x',x);
        elem.setAttribute('y',yh);
        document.getElementById("note_layer").appendChild(elem);
    }

    // additional dots
    for (var i = 0; i < ndots; i++) {
        elem = document.createElementNS(xmlns,'use');
        elem.setAttributeNS(xlinkns,'href','#dotted_note');
        elem.setAttribute('class',classname);
        elem.setAttribute('x',x + dx_dots*i);
        elem.setAttribute('y',y);
        document.getElementById("note_layer").appendChild(elem);        
    }


    // tabulature
    
    elem = document.createElementNS(xmlns,'use');
    id = 'tabulature-' + uniqueid;

    elem.setAttributeNS(xlinkns,'href','#tab' + gn.fret);
    elem.setAttribute('id',id);
    elem.setAttribute('class',classname);
    elem.setAttribute('x',x);
    elem.setAttribute('y',10*(5-gn.string));
    document.getElementById("tabulature2").appendChild(elem);    


    marker.setAttribute('data-note',uniqueid);    
}



function loadsound() {
    var audio;
    var note_letters = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

    for (var octave = 1; octave < 8; octave++) {
        for (var i = 0; i < note_letters.length; i++) {
            audio = new Audio('sound/Piano.pp.' + note_letters[i] + octave + '.ogg');
            audio.onloaded = function() {
                console.log('this');
            }
            sounds.push(audio);
        }
    }
}


function save() {
    var fname, data;
    data = {        
        clef: 'treble',        
        tracks: [notes]};
    
    var blob = new Blob([JSON.stringify(data)], {type: "text/plain;charset=utf-8"});
    fname = document.getElementById('filename').value;
    saveAs(blob, fname);
}


function clear() {
    lineSet.clear();
    noteSet.clear();
    restSet.clear();
}

function importdata(data) {
    var i, j, n, notes = data.tracks[0], duration;
    
    for (i = 0; i < notes.length; i++) {
       for (j = 0; j < notes[i].length; j++) {
           n = notes[i][j];
           if (n.duration !== undefined) {
               duration = n.duration;
           }
           // old way
           if (n.length !== undefined) {
               duration = 1/n.length;
           }

           add_note(i,{n: n.n, duration: duration, 
                       position: n.position, accidental: n.accidental,
                       what: 'note'});
       }
    }
}

function load(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) {
      var r = new FileReader();
      r.onload = function(e) { 
	      //var contents = e.target.result;
          importdata(JSON.parse(e.target.result));
/*          
        alert( "Got the file.n" 
              +"name: " + f.name + "n"
              +"type: " + f.type + "n"
              +"size: " + f.size + " bytesn"
              + "starts with: " + contents.substr(1, contents.indexOf("n"))
        );  */
        
      }
      r.readAsText(f);
    } else { 
      alert("Failed to load file");
    }
  }

function loadexample() {
    var url = 'bibabutzemann.txt';

    jQuery.ajax({
        dataType: "json",
        url: url,
        success: function(data) { 
            importdata(data); 
        }
    });
}

// list of number power of 2
// 2^i0, 2^(i0+1), ... 2^i1
function rangepow2(i0,i1) {
    var r = [];
    for (var i=i0; i < i1; i++) {
        r.push(Math.pow(2,i));
    }

    return r;
}


$(document).ready(function() {
    setup();    


    var tune = null;
    document.getElementById('play').addEventListener('click', function() {
        tune = new MusicPlayer(notes,sounds);
        tune.startplay();
    }, false);

    document.getElementById('stop').addEventListener('click', function() {
        if (tune) {
            tune.stop();
            tune = null;
        }
    }, false);

    document.getElementById('clear').addEventListener('click', clear, false);
    document.getElementById('save').addEventListener('click', save, false);
    document.getElementById('fileinput').addEventListener('change', load, false);
    document.getElementById('loadexample').addEventListener('click', loadexample, false);

    loadsound();



    //add_line(4.5,'barline')

    noteSet = new SymbolSet('note',notes,rangepow2(0,6),'translate(15,23) scale(0.3)',{n0: -9, n1: 18});
    //noteSet.click = click_note_mark;
    noteSet.add = add_note;

    //restSet = new SymbolSet('rest',rest_marker,rangepow2(-2,6),'translate(15,0) scale(0.3)');
    restSet = new SymbolSet('rest',notes,rangepow2(-2,6),'translate(15,0) scale(0.3)');
    //restSet.click = click_note_mark;

    lineSet = new SymbolSet(
        'line',line_marker,
        ['barline','double','repeatstart','repeatend'],
        'translate(15,1) scale(0.35)',{xoffset: 0.5});
    //lineSet.add = add_line;
    //lineSet.remove = remove_line_mark;

    $('.ui-image').click(function() {                
        var elems = document.querySelectorAll('.ui-image');
        for (i = 0; i < elems.length; i++) {
            elems[i].classList.remove('selected');
        }
        
        this.classList.add('selected');
        var sel = this.firstChild.href.baseVal.replace('#','').split('_');
        
        $('.note_marker').hide();
        $('.line_marker').hide();
        $('.rest_marker').hide();

        $('.' + sel[0] + '_marker').show(); 
    });

    // quarter note selected by default
    //document.querySelectorAll('.ui-image')[2].classList.add('selected');
    $('.ui-image use[href = #note_4]').trigger('click')


/*    $('.note_marker').click(function() {
        click_note_mark(this);
    });


    $('.line_marker').click(function() {
        click_line_mark(this);
    });

    $('.rest_marker').click(function() {
        click_note_mark(this);
    });
*/

    loadexample();

    for (var i = 0; i < 30; i++) {
        //add_note(i,i,4);
    }
    


    
    
/*
      <svg xmlns="http://www.w3.org/2000/svg" height="30" width="30" version="1.0" xmlns:xlink="http://www.w3.org/1999/xlink" style="border: 1px solid black">
        <use xlink:href="#note_8" transform="translate(15,23) scale(0.3)" />             
      </svg>*/

});
