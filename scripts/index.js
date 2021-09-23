import planets from "http://127.0.0.1:5500/scripts/planets.js";
import calc from "http://127.0.0.1:5500/scripts/modules/calc.js";

/* Functions */

const capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase()
}

const populateSettings = function(system) {
    const table = $('#table-body');
    table.empty();
    system.data.forEach(function(el, i){
        if (i<1) {
            table.append(`<tr id="${el.name}-settings">
                <th>${capitalize(el.name)}</th>
                <td><i id="${el.name}-hide" class="btn far fa-eye"></i></td>
            </tr>`)
        } else {
            table.append(`<tr id="${el.name}-settings">
                <th>${capitalize(el.name)}</th>
                <td><i id="${el.name}-hide" class="btn far fa-eye"></i></td>
                <td><i id="${el.name}-orbit" class="btn far fa-eye-slash"></i></td>
                <td><i id="${el.name}-focus" class="btn far fa-circle"></i></td>
            </tr>`)
        }
        table.children().last().css({color: `${el.element.color}`})
    })
}

/* Setup */

// const solSystem = new planets.SIM(planets.randomSystem(10), 1, 1);
const solSystem = new planets.SIM(planets.solarSystem, 1, 1);
$('#scale-range').val(solSystem._scale)
$('#step-range').val(solSystem.step)
const events = new planets.EVENTS(solSystem);

solSystem.setCanvas("#canvas");
solSystem.scaling = 1000;
solSystem.addPlanets();
populateSettings(solSystem)
events.interval(10);

/* Event Handling */

events.setEventHandler($("#scale-minus"), "click", () => {
    solSystem.scaleAdd(-0.1)   // reduce scale button
    if (solSystem._scale<0) {solSystem._scale=0}
    $('#scale-range').val(solSystem._scale)
});
events.setEventHandler($("#scale-plus"), "click", () => {
    solSystem.scaleAdd(0.1)    // increase scale button
    if (solSystem._scale>6) {solSystem._scale=6}
    $('#scale-range').val(solSystem._scale)
}); 
events.setEventHandler($("#scale-range"), "input", (event) => {
    solSystem._scale = Number($("#scale-range").val());
});
events.setEventHandler($('#size-minus'), 'click', () => {
    solSystem.sizeAdd(-100)   // reduce step button
    if (solSystem.scaling<1) {solSystem.scaling=1}
    $('#size-range').val(solSystem.scaling)
});
events.setEventHandler($('#size-plus'), 'click', () => {
    solSystem.sizeAdd(100)   // increase step button
    if (solSystem.scaling>2000) {solSystem.scaling=2000}
    $('#size-range').val(solSystem.scaling)
}); 
events.setEventHandler($("#size-range"), "input", (event) => {
    solSystem.scaling = Number($("#size-range").val());
});
events.setEventHandler($('#step-minus'), 'click', () => {
    solSystem.stepAdd(-1)   // reduce step button
    if (solSystem.step<0) {solSystem.step=0}
    $('#step-range').val(solSystem.step)
});
events.setEventHandler($('#step-plus'), 'click', () => {
    solSystem.stepAdd(1)   // increase step button
    if (solSystem.step>20) {solSystem.step=20}
    $('#step-range').val(solSystem.step)
}); 
events.setEventHandler($("#step-range"), "input", (event) => {
    solSystem.step = Number($("#step-range").val());
});
events.setEventHandler($("#date-range"), "input", (event) => {
    solSystem.d = Number($("#date-range").val());
});
events.setEventHandler($("#date-input"), "input", (event) => {
    let input = $("#date-input").val();
    solSystem.d = calc.getEpoch(...input.split('-'));
});

// jQuery

const main = function(){
    $('.navbar').find('li').hover(function(event){
        $(this).toggleClass('navbar-hover')
    })
    $('#socials-btn').mouseenter(function(event){
        $('#socials').children().delay(300).slideDown(100)
        $('#socials').animate({width:'show'}, 350);
    })
    $('#socials-btn').parent().mouseleave(function(event){
        $('#socials').children().slideUp(100)
        $('#socials').delay(100).animate({width:'hide'}, 350)
    })
    $('#settings-btn').click(function(event){
        $('#settings').slideToggle(200)
        $('#credit').fadeToggle(200)
        $('#timeline').fadeToggle(200)
    }).hover(function(event){
        $(this).animate({opacity: '1'}, 100)
    }, function(event){
        $(this).animate({opacity: '0.5'}, 100)
    })
    $('.btn').hover(function(event){
        $(this).toggleClass('btn-hover')
    }).click(function(event){
        let [planet, action] = $(this).attr('id').split('-')
        switch (action) {
            case 'hide':
                $(`#${planet}`).children('circle').toggle()
                $(this).toggleClass('fa-eye fa-eye-slash')
                break;
            case 'orbit':
                $(`#${planet}`).children('path').toggle()
                $(this).toggleClass('fa-eye-slash fa-eye')
                break;
            case 'focus':
                $(this).toggleClass('fa-circle fa-dot-circle');
                if (!solSystem._focus.focused) {
                    solSystem._focus.focused = true;
                    solSystem._focus.focus = planet;
                    document.title = planet;
                } else {
                    if (solSystem._focus.focus == planet) {
                        solSystem._focus.focused = false;
                        solSystem._focus.focus = false;
                        document.title = "Planets"
                    } else {
                        $(`#${solSystem._focus.focus}-focus`).toggleClass('fa-circle fa-dot-circle');
                        solSystem._focus.focus = planet;
                        document.title = planet;
                    }
                }
                break;
            default:
                break;
        }
    })
}

$(document).ready(main);