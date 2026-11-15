import type { Script } from '../dialogue/runner';

/** Slice dialogue (spec §6, Acts 1, 3, 4). English first; Vietnamese in Plan 4. */
export const LINES: Script = {
  meetPip: [
    { speaker: 'pip', face: 'happy', text: "I'm Pip. Construction robot. I came with the cargo landers and built this whole camp from a blueprint. Nobody told me who it was for." },
    { speaker: 'pip', face: 'happy', text: "I've been talking to my arm the whole time. Its name is Arm. I named it." },
    { speaker: 'pip', face: 'curious', text: "Arm doesn't talk much. You'll be a big improvement." },
  ],
  rover_ready: [
    { speaker: 'houston', text: 'Artemis IV, your rover is on the surface. Top speed is eighteen kilometres per hour, and it will not climb slopes steeper than twenty degrees.' },
    { speaker: 'pip', face: 'excited', text: "A car! Can I ride on the back? I'll hold on with Arm. Arm is very strong." },
  ],
  houston_pip: [
    { speaker: 'houston', text: 'Artemis IV, that is the construction robot from the cargo landers. Its radio only reaches a few dozen metres, so nobody has heard it until now.' },
    { speaker: 'pip', face: 'curious', text: 'Houston? A voice from... Earth? Through your helmet? Hello! Hello, Earth!' },
  ],
  pip_heard: [
    { speaker: 'pip', face: 'scared', text: 'Wait... you can HEAR me?!' },
    { speaker: 'pip', face: 'excited', text: 'Seven months and nobody ever answered! A real human! A REAL human! Sorry. I got a little emotional.' },
  ],
  pip_mutter: [
    { speaker: 'pip', face: 'curious', text: 'Arm, did you see that? A big ship. A REALLY big ship. It landed right on my nice clean pad.' },
    { speaker: 'pip', face: 'worried', text: 'Something is walking out of it... Should we say hi? You say hi first. No, you. You have the hand.' },
  ],
  silenceExplain: [
    { speaker: 'pip', face: 'curious', text: 'Do you hear anything out here? No? Exactly!' },
    { speaker: 'pip', face: 'happy', text: 'No air means no sound. You only hear me through your radio. I know. Lucky you.' },
  ],
  hammerFeatherIntro: [
    { speaker: 'pip', face: 'happy', text: "I carried this feather for seven months, waiting for this exact moment. Drop it together with the hammer!" },
  ],
  hammerFeatherResult: [
    { speaker: 'pip', face: 'curious', text: 'They landed at the same time! No air pushing on the feather. Galileo was right, and astronaut David Scott proved it here in 1971.' },
  ],
  shadowQuiz: [
    { speaker: 'pip', face: 'curious', text: 'Quiz! This rock is one meter tall. How long is its shadow?' },
    { speaker: 'pip', face: 'happy', text: 'About 38 meters! At the south pole the Sun barely peeks above the horizon.' },
  ],
  firstSample: [
    { speaker: 'pip', face: 'curious', text: 'That white rock is anorthosite. It is part of the Moon’s ancient crust.' },
    { speaker: 'pip', face: 'happy', text: 'Photo, position, description, bag. You are a real field geologist now.' },
  ],
  houstonWelcome: [
    { speaker: 'player', text: 'Houston, Artemis IV. Antenna is up.' },
    { speaker: 'houston', text: 'Welcome to the Moon, Artemis IV. We are sending your task list now.' },
    { speaker: 'pip', face: 'curious', text: 'Did you notice the pause? Radio waves take about 1.3 seconds to reach Earth, and 1.3 seconds to come back.' },
    { speaker: 'pip', face: 'excited', text: 'Can I... can I talk to Houston myself? With the big antenna? Hello, Houston! This is Pip! I built the camp!' },
    { speaker: 'houston', text: 'Hello, Pip. We hear you loud and clear. Thank you for the camp. It looks great.' },
    { speaker: 'pip', face: 'love', text: 'They said thank you. Arm, did you hear? Earth said thank you.' },
    { speaker: 'houston', text: 'Heads up: Earth will set below your horizon in a few days. Plan your work.' },
  ],
  moduleDone: [
    { speaker: 'pip', face: 'happy', text: 'Locked in! Teamwork! Mostly my arm, but teamwork.' },
    { speaker: 'pip', face: 'curious', text: 'Things weigh six times less here, but they are just as hard to stop once they move. Mass does not change, only weight.' },
  ],
  tracksFound: [
    { speaker: 'pip', face: 'curious', text: 'Wait. Wheel tracks. Six wheels, metal mesh...' },
    { speaker: 'pip', face: 'worried', text: "These aren't mine. I have four wheels, not six. And as far as I know, there is no other robot here." },
  ],
  followTracks: [
    { speaker: 'pip', face: 'worried', text: "These tracks are old. There is no wind here, so tracks can last for millions of years. Apollo bootprints are still there today." },
    { speaker: 'pip', face: 'worried', text: 'Look how they wobble. Whatever made them was getting weaker.' },
  ],
  micaFound: [
    { speaker: 'pip', face: 'dots', text: '', pauseBeforeMs: 5000 },
    { speaker: 'pip', face: 'curious', text: 'Another... robot? Here?' },
    { speaker: 'pip', face: 'sad', text: '...It has been here alone. For a very long time.' },
    { speaker: 'pip', face: 'sad', text: "We can't leave it here. Right?" },
  ],
  micaIdentify: [
    { speaker: 'player', text: 'There is a name under the dust. M-I-C-A. Houston, do you copy?' },
    { speaker: 'houston', text: 'MICA? We lost contact with that rover almost two years ago. Nobody knew what happened to it.' },
  ],
  micaIdentifyEarthDown: [
    { speaker: 'player', text: 'There is a name under the dust. M-I-C-A.' },
    { speaker: 'pip', face: 'sad', text: 'Earth is below the horizon. Nobody can hear us right now. Just like nobody could hear MICA.' },
  ],
  micaWake: [
    { speaker: 'mica', text: 'System: restarted. Current date: unknown. Power: 6 percent. ...Someone is here. Probability: unexpected.' },
    { speaker: 'pip', face: 'happy', text: "HELLO! I'm Pip! You're MICA, right? I towed you all the way here! You're heavy, but I don't mind!" },
    { speaker: 'mica', text: 'Unit Pip. You spoke 41 words in 8 seconds. Communication efficiency: low.' },
    { speaker: 'pip', face: 'happy', text: '(whispering) I think it likes me.' },
  ],
  // ---- Plan 3: journey stops (spec v3 §7) ----
  stop_landing: [
    { speaker: 'pip', face: 'happy', text: 'Landing Zone! I swept it myself. With my arm. Arm did most of the work, to be fair.' },
    { speaker: 'pip', face: 'curious', text: 'Your lander is fifty meters tall. Its shadow is two kilometers long. The Sun is that low here.' },
    { speaker: 'pip', face: 'excited', text: 'Oh! And you brought a flag. The orange ring by the lander is the spot. Press E there.' },
  ],
  stop_base: [
    { speaker: 'pip', face: 'happy', text: 'Welcome to Shackleton Camp! Four empty pads, four crates out there. Teamwork time.' },
    { speaker: 'pip', face: 'proud', text: 'I picked this spot because it gets sunlight most of the time. I am very good at real estate.' },
  ],
  stop_solarHill: [
    { speaker: 'pip', face: 'excited', text: 'Sunny Hill! Almost always in the sunlight. Perfect for the solar tower.' },
    { speaker: 'pip', face: 'worried', text: "The slope, though. Loose dust, steep climb. My wheels and I have... concerns." },
  ],
  stop_boulderField: [
    { speaker: 'pip', face: 'curious', text: 'Rolling Boulder Field. Some of these rocks went for a walk down the slope. A very long time ago.' },
  ],
  stop_freshCrater: [
    { speaker: 'pip', face: 'curious', text: 'A fresh crater! Its rim is still bright. Something hit here not so long ago, as Moon time goes.' },
    { speaker: 'pip', face: 'worried', text: 'Careful: rocks facing the Sun are hot enough to cook on. The shadow next to them is colder than any freezer.' },
  ],
  stop_earthPeak: [
    { speaker: 'pip', face: 'love', text: 'Earth View Peak. Look. That little blue marble is home. Everyone you know is on it.' },
    { speaker: 'pip', face: 'happy', text: 'From down in the camp, Earth hides behind the hills. Up here we can talk to Houston much more often, but even here Earth slowly dips and rises again over the month.' },
  ],
  stop_tracks: [
    { speaker: 'pip', face: 'curious', text: 'Hm. The ground here looks... disturbed. Keep your eyes open.' },
  ],
  stop_darkCrater: [
    { speaker: 'pip', face: 'scared', text: 'The Dark Crater. The Sun has not touched its floor in billions of years.' },
    { speaker: 'pip', face: 'worried', text: 'It is colder down there than the surface of Pluto. Stay close to my light.' },
  ],
  pipFar: [
    { speaker: 'pip', face: 'worried', text: 'Hey! Wait for me! My wheels are fast, but my feelings are faster.' },
    { speaker: 'pip', face: 'sad', text: 'Seven months alone was enough. Please do not leave me behind again.' },
  ],
  // ---- Plan 3: gentle rescues (no game over, v2 §5.8) ----
  rescue_o2: [
    { speaker: 'pip', face: 'worried', text: 'Your oxygen ran out, so I towed you back to camp. Gently. Mostly.' },
    { speaker: 'pip', face: 'curious', text: 'Real moonwalks are planned around the backpack: about eight hours of air. Always know your way home.' },
  ],
  rescue_heat: [
    { speaker: 'pip', face: 'worried', text: 'Your suit got too cold, so I brought you back. Down in the Dark Crater it is about minus 230 degrees.' },
    { speaker: 'pip', face: 'curious', text: 'With the radiator module installed, I get a heater, and we can stay down there much longer.' },
  ],
  rescue_pip: [
    { speaker: 'pip', face: 'sleep', text: 'My battery hit zero in the shadow. Thanks for carrying me home.' },
    { speaker: 'pip', face: 'happy', text: 'Solar panels need sunlight. That is the whole problem of the lunar south pole, in one sentence.' },
  ],
  // ---- Plan 3: Pip upgrades (spec v3 §7.1) ----
  upgrade_solarTower: [
    { speaker: 'pip', face: 'excited', text: 'Woo! I can feel the sunlight again. A robot needs sunshine like you need breakfast.' },
  ],
  upgrade_radiator: [
    { speaker: 'pip', face: 'happy', text: 'The radiator gave me a heater! Now I can follow you into the Dark Crater without my joints freezing.' },
  ],
  upgrade_habitat: [
    { speaker: 'pip', face: 'love', text: 'The habitat has an electrodynamic dust shield. If my panels get dusty, clean me at camp. Please. I am begging.' },
  ],
  upgrade_antenna: [
    { speaker: 'pip', face: 'happy', text: 'Camp antenna online. When Earth is up, Houston can hear us from here.' },
  ],
  eds_clean: [
    { speaker: 'pip', face: 'excited', text: 'Woo! I can feel the sunlight again. This is exactly what MICA never had.' },
  ],
  // ---- Plan 3: Sunny Hill winch (spec v3 §7, stop 3) ----
  winch_stuck: [
    { speaker: 'pip', face: 'worried', text: 'Uh-oh. My wheels are spinning but I am going nowhere. The dust here is soft as flour.' },
    { speaker: 'pip', face: 'curious', text: 'Climb to the top and plant my winch anchor. Then I can pull myself up. Teamwork!' },
  ],
  winch_anchor: [
    { speaker: 'pip', face: 'happy', text: 'Anchor set! Tell me when, and I will winch us up. Me and the crate. Mostly the crate.' },
  ],
  winch_done: [
    { speaker: 'pip', face: 'excited', text: 'We made it! A rover called Spirit got stuck in soft ground on Mars and never got out. Not us!' },
  ],
  // ---- Plan 3: boulder trail red herring & fresh crater (spec v3 §7, stops 4–5) ----
  boulder_seen: [
    { speaker: 'pip', face: 'excited', text: 'TRACKS! Something drove down this slope! Another rover? A friend?' },
    { speaker: 'pip', face: 'curious', text: 'Hold on. Let me scan it with my LIDAR before I get too excited. Press R.' },
  ],
  boulder_scan: [
    { speaker: 'pip', face: 'laugh', text: 'Ha! Not wheels. A boulder! It rolled down the hill and left a groove. I almost made friends with a rock.' },
    { speaker: 'pip', face: 'curious', text: 'Real tracks would show treads or wheel marks. Remember that. It might matter later.' },
  ],
  crater_thermal: [
    { speaker: 'pip', face: 'curious', text: 'See the colors? The sunlit rocks are around 115 degrees. The shadow next to them is about minus 150.' },
    { speaker: 'pip', face: 'excited', text: 'And those bright little specks are glass beads, melted by the impact. Grab a sample!' },
  ],
  // ---- Plan 3: Artemis IV flag (spec v3 §6) ----
  flag_plant: [
    { speaker: 'player', text: 'Sea of Tranquility, 1969. Lunar south pole, 2028.' },
    { speaker: 'pip', face: 'love', text: 'It does not wave. No air, no wind. That bar along the top holds it out, just like the Apollo flags.' },
  ],
  // ---- Plan 3: Earth View Peak relay (spec v3 §7, stop 6) ----
  relay_deploy: [
    { speaker: 'pip', face: 'excited', text: 'Relay up! Now let me aim the dish. Earth is small and I have a steady arm.' },
  ],
  relay_noEarth: [
    { speaker: 'pip', face: 'sad', text: 'Earth is hiding behind the horizon right now. No line of sight, no signal. We will have to wait for it to rise.' },
  ],
  relay_align: [
    { speaker: 'houston', text: 'Artemis IV, we have your relay signal. Loud and clear. Map data coming down now.' },
    { speaker: 'pip', face: 'happy', text: 'My LIDAR can see much farther now, and you get a map. Press M. You are welcome.' },
  ],
  // ---- Plan 3: Dark Crater (spec v3 §7, stop 8; §7.4) ----
  dark_enter: [
    { speaker: 'pip', face: 'scared', text: 'Heater on. Lamp on. Courage... loading.' },
  ],
  dark_noHeater: [
    { speaker: 'pip', face: 'scared', text: 'Too cold for my joints without a heater! Your suit will not last long either. Install the radiator at camp first.' },
  ],
  mica_ice: [
    { speaker: 'mica', text: 'Unit Pip. Human. Day 612: hydrogen signal, very high, inside the dark crater. Coordinates transmitted.' },
    { speaker: 'mica', text: 'Ice sample: not collected. Mission: incomplete. Request: complete it.' },
    { speaker: 'pip', face: 'excited', text: 'MICA found ice before it got stuck! See the orange beam? That is the spot. Let us finish its mission.' },
  ],
  ice_found: [
    { speaker: 'pip', face: 'love', text: 'Ice! Frozen water, kept in the dark for billions of years. Drinking water, air, even rocket fuel, one day.' },
    { speaker: 'mica', text: 'Sample confirmed. Mission: complete. ...Thank you.' },
  ],
  // ---- Plan 3 final review: ice lines that match what has happened ----
  ice_found_alone: [
    { speaker: 'pip', face: 'love', text: 'Ice! Frozen water, kept in the dark for billions of years. Drinking water, air, even rocket fuel, one day.' },
    { speaker: 'pip', face: 'curious', text: 'Funny. Those wheel tracks we saw were heading this way too...' },
  ],
  mica_ice_done: [
    { speaker: 'mica', text: 'Unit Pip. Human. Day 612: hydrogen signal, very high, inside the dark crater.' },
    { speaker: 'pip', face: 'proud', text: 'We know! We already got the ice. Your mission is complete, MICA.' },
    { speaker: 'mica', text: '...Mission: complete. Thank you.' },
  ],
  // ---- Plan 4: radiation storm (v2 scene 4.2) ----
  storm_warning: [
    { speaker: 'houston', text: 'Artemis IV, Houston. Solar particle event in progress. Protons arriving at the Moon in about fifty minutes. Get under shielding now.' },
    { speaker: 'pip', face: 'scared', text: "Let's go! Not that I'm scared. My circuits are just very precious." },
    { speaker: 'pip', face: 'worried', text: 'Camp shelter or the lander. MICA can wait out here. It has waited a long time already.' },
  ],
  storm_shelter: [
    { speaker: 'pip', face: 'curious', text: "Why not just hide behind a big rock? Because storm protons don't fly in a straight line from the Sun. They come from almost every direction." },
    { speaker: 'pip', face: 'proud', text: 'A thick layer of soil over our heads stops them. I piled up this whole shelter myself. Seven months. You are welcome.' },
  ],
  storm_clear: [
    { speaker: 'houston', text: 'Artemis IV, the proton flux is dropping back to normal. You are clear to go outside.' },
    { speaker: 'pip', face: 'happy', text: 'All clear! Now, where did we leave our sleepy friend?' },
  ],
  storm_clear_camp: [
    { speaker: 'houston', text: 'Artemis IV, the proton flux is dropping back to normal. You are clear to go outside.' },
    { speaker: 'pip', face: 'happy', text: 'All clear! And MICA rode out the storm right here at camp. Old robots are tough.' },
  ],
  rescue_storm: [
    { speaker: 'pip', face: 'worried', text: 'Got you! I dragged you under the shelter. Out in the open, your suit was soaking up radiation.' },
    { speaker: 'pip', face: 'curious', text: 'On the Moon there is no thick air and no magnetic field to stop solar storms. Only shielding works. MICA is right where we left it.' },
  ],
  // ---- Plan 4: MICA's memory (v2 scene 4.5) and Act 5 opening ----
  mica_memory_intro: [
    { speaker: 'mica', text: 'Memory index: corrupted. Images: intact. Dates: lost.' },
    { speaker: 'pip', face: 'curious', text: 'Photos of the same rock! If we put them in order, MICA can rebuild its log.' },
  ],
  mica_logs: [
    { speaker: 'mica', text: 'Day 588. Reached the rim of the dark crater. Beginning search for water ice.' },
    { speaker: 'mica', text: 'Day 612. Very strong hydrogen signal on the crater floor. Probability of water ice: high.' },
    { speaker: 'mica', text: 'Day 640. Solar panels: 31% covered by dust. No cleaning tool available.' },
    { speaker: 'mica', text: 'Day 655. Radiation memory errors: increasing.' },
    { speaker: 'mica', text: 'Day 671. Power 3%. Priority: send data to Earth.' },
    { speaker: 'mica', text: '...No Earth in the sky.', pauseBeforeMs: 1500 },
  ],
  mica_mission: [
    { speaker: 'mica', text: 'My mission is not complete. The data was never sent. The ice was never sampled.' },
    { speaker: 'pip', face: 'excited', text: 'Then there are three of us now!' },
  ],
  act5_bridge: [
    { speaker: 'player', text: 'Weeks of work at camp, with PIP and MICA beside me. Now our routine faces its first long night.' },
  ],
  act5_news: [
    { speaker: 'houston', text: 'Artemis IV, Houston. Heads up: in about six hours the Sun slips behind the hill north of your camp. Our terrain models say you will be in shadow for three and a half days.' },
    { speaker: 'houston', text: 'Earth stays above your horizon, so we can still talk, but your batteries have to carry the shelter, Pip and MICA through the dark.' },
    { speaker: 'houston', text: 'From here on... you decide.' },
    { speaker: 'pip', face: 'worried', text: 'Three and a half days without sunlight. Okay. Okay! We prepare. Shelter first, panic later.' },
  ],
  act5_sunset: [
    { speaker: 'pip', face: 'sad', text: 'Look at the shadow of the hill. It is sliding over the camp like a slow wave.' },
    { speaker: 'pip', face: 'worried', text: 'This is the long shadow. Here it comes.' },
  ],
  // ---- Plan 4: sunrise notch (v2 scene 5.2) ----
  notch_intro: [
    { speaker: 'pip', face: 'curious', text: 'The real hill around our camp, measured by a laser from orbit. The dots are where the Sun has been.' },
    { speaker: 'pip', face: 'curious', text: 'It slides about twelve degrees a day and barely changes height. Where will it peek over the hill first?' },
  ],
  notch_pick: [
    { speaker: 'pip', face: 'proud', text: 'Turning my panels to face that notch. MICA too. When the first ray comes, we catch it.' },
    { speaker: 'mica', text: 'Panel azimuth set. Waiting is a skill. I am good at it.' },
  ],
  // ---- Plan 4: heat leaks (v2 scene 5.2) ----
  leak_found: [
    { speaker: 'pip', face: 'curious', text: 'See the orange glow? That is heat leaking out of the shelter and radiating away into the black sky.' },
    { speaker: 'pip', face: 'happy', text: 'No air here, so no wind carries it off. It just shines away as infrared. Let me cover it.' },
  ],
  leak_fixed: [
    { speaker: 'pip', face: 'proud', text: 'Berm done! Moon dust barely conducts heat. It is the fluffiest blanket in the solar system.' },
  ],
  // ---- Plan 4: the long night (v2 scenes 5.3, 5.5) ----
  mica_offer: [
    { speaker: 'mica', text: 'Analysis: energy insufficient for three. I am an old robot. Proposal: shut me down to save energy for you.' },
    { speaker: 'pip', face: 'sad', text: 'No. No, no, no.' },
  ],
  mica_enough: [
    { speaker: 'mica', text: 'Analysis: energy sufficient for three. ...Unexpected.' },
    { speaker: 'mica', text: 'Thank you.' },
    { speaker: 'pip', face: 'love', text: 'Sealing those leaks paid off! Moon dust blankets for everyone!' },
  ],
  mica_kept: [
    { speaker: 'pip', face: 'happy', text: 'Nobody gets left in the dark. Not this time.' },
    { speaker: 'mica', text: 'Power rerouted. Every watt counted. ...Acceptable. Thank you.' },
  ],
  mica_slept: [
    { speaker: 'mica', text: 'Shutdown accepted. Wake me when the Sun comes back. I will be here.' },
    { speaker: 'pip', face: 'sad', text: 'It is only until morning, MICA. I promise.' },
  ],
  pip_sleep_fear: [
    { speaker: 'pip', face: 'worried', text: 'I have to hibernate to save my battery. But... MICA slept too. For almost two years.' },
    { speaker: 'mica', text: 'Confirmed. I slept once. Not recommended.' },
    { speaker: 'pip', face: 'dizzy', text: 'MICA!' },
    { speaker: 'mica', text: '...That was a joke. I am learning.' },
    { speaker: 'pip', face: 'laugh', text: 'You just made a joke?! That was terrible! I love it! Good night...' },
  ],
  night_day2: [
    { speaker: 'player', text: 'Stars everywhere now. And Earth is just a thin silver crescent next to where the Sun went down.' },
  ],
  pip_sleep_alone: [
    { speaker: 'pip', face: 'worried', text: 'MICA is asleep. My turn to save power now… You will be here when the sunlight comes back, right?' },
    { speaker: 'player', text: 'I will watch the camp. Good night, PIP. We will wake MICA together.' },
  ],
  night_day3_offline: [
    { speaker: 'player', text: 'The radio is off to save power. Earth is still there. I will tell Houston how we managed when we reconnect.' },
  ],
  night_day4_alone: [
    { speaker: 'player', text: 'The eastern ridge is beginning to glow. Hang on, PIP. Hang on, MICA. Morning is close.' },
  ],
  night_day3: [
    { speaker: 'houston', text: 'Artemis IV, Houston. Thinking of you out there. The Sun is circling behind your hill right on schedule.' },
  ],
  night_day4: [
    { speaker: 'mica', text: 'Observation: the ridge to the east is glowing. Sunrise in less than one day.' },
  ],
  // ---- Plan 4: dawn and the ending (v2 K.1–K.3) ----
  dawn_pip_good: [
    { speaker: 'pip', face: 'excited', text: 'Light! Right through the notch, right onto my panels!' },
    { speaker: 'pip', face: 'laugh', text: '...I just dreamed a really good joke. I forgot it. But it was great.' },
  ],
  dawn_pip_late: [
    { speaker: 'pip', face: 'dizzy', text: 'Mmm... the Sun came up over there? My panels were facing the wrong way. Charging... slowly...' },
    { speaker: 'pip', face: 'happy', text: 'Still, I am awake! Turn me toward the light when you can. Q and I will come to you.' },
  ],
  dawn_mica_kept: [
    { speaker: 'mica', text: 'System: online. Battery warm. Success rate: 100%.' },
    { speaker: 'mica', text: "...Pip. This morning's joke: acceptable." },
  ],
  dawn_mica_slept: [
    { speaker: 'mica', text: 'System: rebooting. Second boot. Success rate: 100%.' },
    { speaker: 'mica', text: "...Pip. You kept your promise. This morning's joke: acceptable." },
  ],
  comms_on: [
    { speaker: 'pip', face: 'happy', text: 'Comms back on! Earth is still up there. But it sets in less than a day. No time to waste!' },
  ],
  send_data: [
    { speaker: 'player', text: "Houston, Artemis IV. Sending MICA's data. Day 612: hydrogen signal. And a sample of the ice it found." },
    { speaker: 'houston', text: "...We got it. MICA's data. Almost two years... it finally made it home." },
    { speaker: 'mica', text: 'Mission: complete. This time, before the Earth set.' },
  ],
  farewell: [
    { speaker: 'pip', face: 'sad', text: 'Will you come back? I will keep the base clean. Almost clean.' },
    { speaker: 'pip', face: 'love', text: 'And this time... I am not alone.' },
    { speaker: 'mica', text: 'Confirmed. I will supervise Pip. Expected supervision efficiency: low.' },
  ],

  // ---- Plan 5: orbital landing intro (v2 M1–M5) ----
  landing_m1: [
    { speaker: 'houston', text: 'Artemis IV, Houston. You are GO to transfer to the lander.' },
    { speaker: 'commander', text: 'Copy, Houston. Hatch is open. The Moon is right outside the window.' },
  ],
  landing_tranquility: [
    { speaker: 'houston', text: 'Look down at that dark plain. That is the Sea of Tranquility.' },
    { speaker: 'houston', text: 'The marker is Tranquility Base. Apollo 11 landed there on 20 July 1969. Let us look back at where the journey began.' },
  ],
  landing_undock: [
    { speaker: 'commander', text: 'Undocking complete. I see you, everything looks good. Good luck down there.' },
  ],
  landing_burn: [
    { speaker: 'houston', text: 'Begin the braking burn. Hold SPACE to fire the engine and keep your speed inside the green band.' },
  ],
  landing_brake_assist: [
    { speaker: 'houston', text: 'Autopilot has the braking burn. Watch your speed follow the green band.' },
  ],
  landing_warn_fast: [
    { speaker: 'houston', text: 'You are too fast for your height. Hold SPACE to brake harder.' },
  ],
  landing_warn_slow: [
    { speaker: 'houston', text: 'You are slowing too early. Ease off SPACE and let the ship glide.' },
  ],
  landing_alarm: [
    { speaker: 'commander', text: 'Program alarm! Computer overload. Houston, what do we do?' },
    { speaker: 'houston', text: "...We're GO on that alarm! The computer is busy, not broken. Keep going." },
  ],

  // ---- Plan 5: final descent onto the south pole site ----
  land_start: [
    { speaker: 'commander', text: 'Three hundred metres. Landing thrusters on. Your controls.' },
    { speaker: 'commander', text: 'Hold SPACE to push up, A and D to lean. Come down slow and straight: slower than 1 metre per second!' },
  ],
  land_start_auto: [
    { speaker: 'commander', text: 'Three hundred metres. Autopilot is flying the landing. Watch the dust.' },
  ],
  land_ok: [
    { speaker: 'commander', text: 'Contact light. Engine stop. We are on the Moon.' },
    { speaker: 'commander', text: 'Welcome to the south pole. Look at that shadow out the window. Something small just moved by the crates...' },
  ],
  land_tipped: [
    { speaker: 'commander', text: 'Whoa! You were leaning too much and the lander tipped over.' },
    { speaker: 'commander', text: 'That really happened to the Odysseus lander in 2024. It still sent science home. Try again, nice and straight.' },
  ],
  land_tooFast: [
    { speaker: 'commander', text: "Too hard! Let's try that again, gently this time." },
  ],
  land_noFuel: [
    { speaker: 'commander', text: 'The tank ran dry and we dropped! Hovering burns fuel every second. Come down steadily, and do not hang in the air.' },
  ],
  land_drift: [
    { speaker: 'commander', text: 'Soft, but sliding sideways! Lean against the drift with A or D until it reads under 1 metre per second.' },
  ],
  land_suggest_auto: [
    { speaker: 'commander', text: 'Tricky, right? Press H and the autopilot will fly. Real pilots use autopilots too.' },
  ],

  // ---- Plan 5: cargo lander (act 2E) ----
  cargo_warn: [
    { speaker: 'houston', text: 'Artemis IV, Houston. An uncrewed cargo lander is coming down about 650 metres north of camp in 90 seconds.' },
    { speaker: 'houston', text: 'Its exhaust throws dust and grit sideways, very fast and very far. Get Pip behind a ridge.' },
    { speaker: 'pip', face: 'worried', text: 'Sand at a thousand kilometres per hour? My paint says no thank you.' },
  ],
  cargo_pip_hide: [
    { speaker: 'pip', face: 'excited', text: 'Hiding! That ridge blocks the straight line to the landing site. Dust flies flat out here, so low cover is enough.' },
  ],
  cargo_stow_tower: [
    { speaker: 'houston', text: 'Your solar tower is installed. Fold its panels before the cargo lander arrives.' },
  ],
  cargo_pip_safe: [
    { speaker: 'pip', face: 'proud', text: 'Whoosh! The dust went right over my ridge. Not a speck on me!' },
  ],
  cargo_pip_dusty: [
    { speaker: 'pip', face: 'dizzy', text: 'I... I am a sandcastle now. Everything is crunchy. My wheels are slow.' },
  ],
  cargo_pip_eds: [
    { speaker: 'pip', face: 'happy', text: 'The dust shield at camp can zap this off. Bring me home and press E next to me.' },
  ],
  cargo_pip_noeds: [
    { speaker: 'pip', face: 'sad', text: 'Once the habitat module is up we get the dust shield. Until then I will be... crunchy.' },
  ],
  cargo_tower_dusty: [
    { speaker: 'houston', text: 'The solar tower panels took a dust hit, so charging is slower. Brush them off: press E at the tower.' },
  ],
  cargo_tower_brushed: [
    { speaker: 'pip', face: 'happy', text: 'Shiny panels again! Fast charging is back.' },
  ],

  // ---- Plan 5: horizon glow (2G, still debated) ----
  glow_seen: [
    { speaker: 'pip', face: 'curious', text: 'Look, just above the horizon toward the Sun. That faint glow!' },
    { speaker: 'pip', face: 'curious', text: 'Could be charged dust floating... scientists still argue about it. I am on the side of... let me watch a bit longer.' },
  ],
};
