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


function MusicPlayer(notes,sounds) {
    this.notes = notes;
    this.sounds = sounds;

    this.current_index = 0;
    // play current notes (ring of size 10)
    // return false if last note otherwise true
    this.playing_notes = [];
    this.playing_notes_size = 10;
    this.playing_notes_index = 0;
    this.timeout = null;
    
}


MusicPlayer.prototype.playcurrent = function() {
    var j, s, audio, duration = -1;
    
    if (this.notes[this.current_index] !== undefined) {
        if (this.notes[this.current_index] instanceof Array) {
            // this.notes[this.current_index] is a list of notes

            for (var j = 0; j < this.notes[this.current_index].length; j++) {

                

                s = this.sounds[this.notes[this.current_index][j].n + 19];

                audio = new Audio(s.src);
                audio.play();
                duration = this.notes[this.current_index][j].duration;
                
                // add note to ring of playing notes
                // if a note is still playing, stop if first
                if (this.playing_notes[this.playing_notes_index]) {
                    if (!this.playing_notes[this.playing_notes_index].paused) {
                        this.playing_notes[this.playing_notes_index].pause();
                    }
                }
                this.playing_notes[this.playing_notes_index] = audio;
                this.playing_notes_index = (this.playing_notes_index+1) % this.playing_notes_size;
            }
        }
        else if (this.notes[this.current_index].type === 'rest')  {
            duration = this.notes[this.current_index].duration;            
        }
    }
    
    if (this.current_index == this.notes.length-1) {
        // stop
        this.current_index = 0;
        duration = -1;
    }
    else {
        this.current_index++;    
    }
    
    return duration;
    
}

MusicPlayer.prototype.play = function() {
    var milliseconds = 3000, duration, that = this;

    duration = this.playcurrent();
    if (duration !== -1) {    
    
        this.timeout = window.setTimeout(function() {
            that.play();
        }, milliseconds*duration);
    }    
}

MusicPlayer.prototype.startplay = function() {
    this.stop();
    this.play();
}

MusicPlayer.prototype.stop = function() {
    var i;

    if (this.timeout !== null) {
        window.clearTimeout(this.timeout);  
        this.timeout = null;
    }

    this.playing_notes.map(function(_) {
        _.pause();        
    });

    this.current_index = 0;
}
