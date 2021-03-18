var 
    playlistWeb = [
        { 
            url: "http://ebfiles.esy.es/eplayersampleaudiofiles/music1.mp3",
            name: "Mountain Sun"        
        },{
            url: "http://ebfiles.esy.es/eplayersampleaudiofiles/music2.mp3",
            name: "Walk In The Park"
        },{
            url: "http://ebfiles.esy.es/eplayersampleaudiofiles/music3.mp3",
            name: "Nice And Easy"
        },{
            url: "http://ebfiles.esy.es/eplayersampleaudiofiles/music4.mp3",
            name: "Hoedown"
        },{
            url: "http://ebfiles.esy.es/eplayersampleaudiofiles/music5.mp3",
            name: "12 Mornings"
        }
    ],
    playlistLocal = [
        {
            url: "../audPlayer/other_res/audio/music1.mp3",
            name: "Mountain Sun"        
        },{
            url: "../audPlayer/other_res/audio/music2.mp3",
            name: "Walk In The Park"
        },{
            url: "../audPlayer/other_res/audio/music3.mp3",
            name: "Nice And Easy"
        },{
            url: "../audPlayer/other_res/audio/music4.mp3",
            name: "Hoedown"
        },{
            url: "../audPlayer/other_res/audio/music5.mp3",
            name: "12 Mornings"
        }
    ],
    options = {
        playlist: true,
        repeat: 'off',
        shuffle: 'on',
        volume: 0.5,
        autoplay: false,
        preload: 'metadata'
    }
;

var p1 = ePlayer.darkTheme('p1', options, playlistLocal);

options.shuffle='off';
options.repeat='one';

var p2 = ePlayer.darkTheme('p2', options, playlistWeb);
