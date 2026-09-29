import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Room, RoomEvent, Track } from "livekit-client";
import { supabase } from "../lib/supabase";

const LOGO = "/chsdosa-cooperative/chsdosa-icon.png";

const ROOM_NAME = "CHSDOSA General Meeting";

const ADMIN_DEFAULTS = [
  {
    id: "admin1",
    name: "President",
    role: "PRESIDENT",
  },
  {
    id: "admin2",
    name: "Secretary",
    role: "SECRETARY",
  },
  {
    id: "admin3",
    name: "Treasurer",
    role: "TREASURER",
  },
  {
    id: "admin4",
    name: "Room Monitor",
    role: "ROOM MONITOR",
  },
];

const LIVE_THEMES = [
  "linear-gradient(135deg, #071a2b, #0f766e, #102c45)",
  "linear-gradient(135deg, #111827, #1d4ed8, #312e81)",
  "linear-gradient(135deg, #20112d, #7c3aed, #312e81)",
  "linear-gradient(135deg, #35140b, #c2410c, #713f12)",
  "linear-gradient(135deg, #071a2b, #0369a1, #164e63)",
];

const REACTIONS = ["😂", "❤️", "👏", "🔥", "👍", "🎉"];

const GIFTS = [
  { emoji: "🎁", name: "Gift" },
  { emoji: "🌹", name: "Rose" },
  { emoji: "🎂", name: "Cake" },
  { emoji: "🏆", name: "Trophy" },
  { emoji: "💎", name: "Diamond" },
  { emoji: "🎈", name: "Balloon" },
];

function makeAvatar(name) {
  const safeName = name || "CHSDOSA";
  const encodedName = encodeURIComponent(safeName);

  return (
    "https://ui-avatars.com/api/?name=" +
    encodedName +
    "&background=0f766e&color=fff&bold=true"
  );
}

export default function Meeting() {
  const navigate = useNavigate();

  const liveKitRoomRef = useRef(null);
  const audioContainerRef = useRef(null);
  const commentsListRef = useRef(null);
  const messageInputRef = useRef(null);

  const reconnectingAfterRefreshRef = useRef(false);

  const seatAssignmentsRef = useRef({});
  const seatCapacityRef = useRef(20);
  const processedChatIdsRef = useRef(new Set());

  const musicContextRef = useRef(null);
  const musicTimerRef = useRef(null);

  const [member, setMember] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);

  const [adminUser, setAdminUser] = useState(null);

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [seatCapacity, setSeatCapacity] = useState(20);
  const [seatAssignments, setSeatAssignments] = useState({});

  const [showActive, setShowActive] = useState(false);
  const [showFunMenu, setShowFunMenu] = useState(false);

  const [message, setMessage] = useState("");

  const [connectionStatus, setConnectionStatus] = useState("");

  const [entrance, setEntrance] = useState(null);

  const [lockedMic, setLockedMic] = useState(false);

  const [speakingIds, setSpeakingIds] = useState([]);

  const [comments, setComments] = useState([
    {
      id: "welcome-message",
      type: "message",
      name: "Secretary",
      avatar: makeAvatar("Secretary"),
      text: "Good evening everyone.",
      taggedMemberId: null,
    },
  ]);

  const [activeMembers, setActiveMembers] = useState([]);

  const [themeIndex, setThemeIndex] = useState(0);
  const [nextThemeIndex, setNextThemeIndex] = useState(1);
  const [themeFading, setThemeFading] = useState(false);

  const [funAnimations, setFunAnimations] = useState([]);

  const [musicPlaying, setMusicPlaying] = useState(false);

  const currentUser = useMemo(() => {
    const name =
      member?.full_name ||
      member?.name ||
      member?.fullName ||
      "Member";

    const avatar =
      member?.avatar_url ||
      member?.avatar ||
      makeAvatar(name);

    return {
      id: member?.id || "current-user",
      name,
      avatar,
      memberNumber:
        member?.member_number ||
        member?.member_id ||
        "",
    };
  }, [member]);

  useEffect(() => {
    seatAssignmentsRef.current = seatAssignments;
  }, [seatAssignments]);

  useEffect(() => {
    seatCapacityRef.current = seatCapacity;
  }, [seatCapacity]);

  /* =========================
     LOAD MEMBER
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function loadMember() {
      setLoadingMember(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) setLoadingMember(false);
          return;
        }

        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Member loading error:", error);
        }

        if (mounted) {
          setMember(data || null);
        }

        const {
          data: adminData,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminError) {
          console.log(
            "Admin access check:",
            adminError.message
          );
        }

        if (mounted) {
          setAdminUser(adminData || null);
        }
      } catch (error) {
        console.error("Meeting member error:", error);
      } finally {
        if (mounted) {
          setLoadingMember(false);
        }
      }
    }

    loadMember();

    return () => {
      mounted = false;
    };
  }, []);

  const isMeetingAdmin = Boolean(adminUser);

  const admins = ADMIN_DEFAULTS.map((admin) => ({
    ...admin,
    avatar: makeAvatar(admin.name),
  }));

  const memberSeats = Array.from(
    { length: seatCapacity },
    (_, index) => ({
      id: `seat-${index + 1}`,
      number: index + 1,
    })
  );

  /* =========================
     BACKGROUND CROSSFADE
  ========================= */

  useEffect(() => {
    let fadeTimer;
    let nextTimer;

    const startFade = () => {
      setNextThemeIndex(
        (themeIndex + 1) % LIVE_THEMES.length
      );

      setThemeFading(true);

      fadeTimer = setTimeout(() => {
        setThemeIndex(
          (oldIndex) =>
            (oldIndex + 1) % LIVE_THEMES.length
        );

        setThemeFading(false);

        nextTimer = setTimeout(startFade, 7000);
      }, 2500);
    };

    nextTimer = setTimeout(startFade, 7000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextTimer);
    };
  }, [themeIndex]);

  /* =========================
     COMMENTS AUTO SCROLL
  ========================= */

  useEffect(() => {
    const container = commentsListRef.current;

    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [comments]);

  /* =========================
     FUN ANIMATION
  ========================= */

  const showFunAnimation = (
    emoji,
    type = "reaction",
    name = currentUser.name
  ) => {
    const id =
      `${type}-${Date.now()}-${Math.random()}`;

    setFunAnimations((old) => [
      ...old,
      {
        id,
        emoji,
        type,
        name,
      },
    ]);

    window.setTimeout(() => {
      setFunAnimations((old) =>
        old.filter((item) => item.id !== id)
      );
    }, 2600);
  };

  /* =========================
     REMOVE AUDIO
  ========================= */

  const removeAudioTrack = (track) => {
    try {
      const elements = track.detach();

      elements.forEach((element) => {
        element.remove();
      });
    } catch (error) {
      console.log("Audio detach error:", error);
    }
  };

  /* =========================
     ATTACH AUDIO
  ========================= */

  const attachAudioTrack = (track) => {
    if (
      !audioContainerRef.current ||
      track.kind !== Track.Kind.Audio
    ) {
      return;
    }

    try {
      const element = track.attach();

      element.autoplay = true;
      element.setAttribute("aria-hidden", "true");

      audioContainerRef.current.appendChild(element);
    } catch (error) {
      console.error(
        "Unable to attach remote audio:",
        error
      );
    }
  };

  /* =========================
     PARTICIPANT HELPERS
  ========================= */

  const participantToMember = (participant) => {
    const name =
      participant.name ||
      participant.identity ||
      "Member";

    return {
      id: participant.identity,
      name,
      avatar: makeAvatar(name),
    };
  };

  const buildSeatPerson = (person = currentUser) => {
    return {
      id: person.id,
      name: person.name,
      avatar:
        person.avatar ||
        makeAvatar(person.name),
    };
  };

  /* =========================
     PUBLISH DATA
  ========================= */

  const publishRoomData = async (
    topic,
    data
  ) => {
    const room = liveKitRoomRef.current;

    if (!room) return;

    try {
      const payload = new TextEncoder().encode(
        JSON.stringify({
          ...data,
          sender_id: currentUser.id,
        })
      );

      await room.localParticipant.publishData(
        payload,
        {
          reliable: true,
          topic,
        }
      );
    } catch (error) {
      console.error(
        `Room data publish error (${topic}):`,
        error
      );
    }
  };

  /* =========================
     PUBLISH SEAT EVENT
  ========================= */

  const publishSeatEvent = async (event) => {
    await publishRoomData(
      "chsdosa-seats",
      event
    );
  };

  /* =========================
     PUBLISH CHAT
  ========================= */

  const publishChatMessage = async (
    text,
    taggedMemberId = null
  ) => {
    const room = liveKitRoomRef.current;

    if (!room) return;

    try {
      const clientMessageId =
        `${currentUser.id}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      processedChatIdsRef.current.add(
        clientMessageId
      );

      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "chat",
          client_message_id:
            clientMessageId,
          text,
          name: currentUser.name,
          avatar: currentUser.avatar,
          sender_id: currentUser.id,
          taggedMemberId,
        })
      );

      await room.localParticipant.publishData(
        payload,
        {
          reliable: true,
          topic: "chsdosa-chat",
        }
      );
    } catch (error) {
      console.error(
        "Chat publish error:",
        error
      );
    }
  };

  /* =========================
     REACTIONS
  ========================= */

  const sendReaction = async (emoji) => {
    if (!joined) {
      alert("Please join the meeting first.");
      return;
    }

    setShowFunMenu(false);

    showFunAnimation(
      emoji,
      "reaction",
      currentUser.name
    );

    setComments((old) => [
      ...old,
      {
        id: `reaction-${Date.now()}-${Math.random()}`,
        type: "fun",
        name: currentUser.name,
        avatar: currentUser.avatar,
        text: `${emoji} reacted`,
        taggedMemberId: null,
      },
    ]);

    await publishRoomData(
      "chsdosa-fun",
      {
        type: "reaction",
        emoji,
        name: currentUser.name,
        avatar: currentUser.avatar,
      }
    );
  };

  /* =========================
     SLIPPER
  ========================= */

  const throwSlipper = async () => {
    if (!joined) {
      alert("Please join the meeting first.");
      return;
    }

    setShowFunMenu(false);

    showFunAnimation(
      "🩴",
      "slipper",
      currentUser.name
    );

    setComments((old) => [
      ...old,
      {
        id: `slipper-${Date.now()}-${Math.random()}`,
        type: "fun",
        name: currentUser.name,
        avatar: currentUser.avatar,
        text: "🩴 threw a slipper!",
        taggedMemberId: null,
      },
    ]);

    await publishRoomData(
      "chsdosa-fun",
      {
        type: "slipper",
        emoji: "🩴",
        name: currentUser.name,
        avatar: currentUser.avatar,
      }
    );
  };

  /* =========================
     FREE GIFTS
  ========================= */

  const sendGift = async (gift) => {
    if (!joined) {
      alert("Please join the meeting first.");
      return;
    }

    setShowFunMenu(false);

    showFunAnimation(
      gift.emoji,
      "gift",
      currentUser.name
    );

    setComments((old) => [
      ...old,
      {
        id: `gift-${Date.now()}-${Math.random()}`,
        type: "fun",
        name: currentUser.name,
        avatar: currentUser.avatar,
        text: `${gift.emoji} sent a free ${gift.name}`,
        taggedMemberId: null,
      },
    ]);

    await publishRoomData(
      "chsdosa-fun",
      {
        type: "gift",
        emoji: gift.emoji,
        giftName: gift.name,
        name: currentUser.name,
        avatar: currentUser.avatar,
      }
    );
  };

  /* =========================
     FREE ROOM MUSIC
  ========================= */

  const stopRoomMusic = () => {
    try {
      if (musicTimerRef.current) {
        clearTimeout(musicTimerRef.current);
        musicTimerRef.current = null;
      }

      const context = musicContextRef.current;

      if (context) {
        context.close().catch(() => {});
      }

      musicContextRef.current = null;
    } catch (error) {
      console.log("Music stop error:", error);
    }

    setMusicPlaying(false);
  };

  const startRoomMusic = () => {
    try {
      stopRoomMusic();

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        alert(
          "Room music is not supported by this browser."
        );
        return;
      }

      const context = new AudioContext();

      musicContextRef.current = context;

      const notes = [
        261.63,
        329.63,
        392.0,
        329.63,
        293.66,
        349.23,
        440.0,
        349.23,
      ];

      let index = 0;

      const playNote = () => {
        if (
          !musicContextRef.current ||
          context.state === "closed"
        ) {
          return;
        }

        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type = "sine";

        oscillator.frequency.value =
          notes[index % notes.length];

        gain.gain.setValueAtTime(
          0.0001,
          context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.045,
          context.currentTime + 0.03
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.45
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();

        oscillator.stop(
          context.currentTime + 0.5
        );

        index++;

        musicTimerRef.current =
          setTimeout(playNote, 500);
      };

      playNote();

      setMusicPlaying(true);
    } catch (error) {
      console.error(
        "Room music error:",
        error
      );
    }
  };

  const toggleRoomMusic = async (
    broadcast = true
  ) => {
    if (!joined) {
      alert("Please join the meeting first.");
      return;
    }

    setShowFunMenu(false);

    if (musicPlaying) {
      stopRoomMusic();

      if (broadcast) {
        await publishRoomData(
          "chsdosa-fun",
          {
            type: "music-stop",
          }
        );
      }
    } else {
      startRoomMusic();

      if (broadcast) {
        await publishRoomData(
          "chsdosa-fun",
          {
            type: "music-start",
          }
        );
      }
    }
  };

  /* =========================
     JOIN MEETING
  ========================= */

  const joinMeeting = async (
    isAutomaticReconnect = false
  ) => {
    if (joined) return;

    if (!member?.id) {
      if (!isAutomaticReconnect) {
        alert(
          "Your member account could not be found."
        );
      }

      return;
    }

    let room = null;

    try {
      setConnectionStatus(
        isAutomaticReconnect
          ? "Reconnecting to meeting..."
          : "Connecting to meeting..."
      );

      const { data, error } =
        await supabase.functions.invoke(
          "livekit-token",
          {
            body: {
              room_name: ROOM_NAME,
              participant_identity:
                member.id,
              participant_name:
                currentUser.name,
            },
          }
        );

      if (error) {
        throw new Error(
          error.message ||
            "Unable to connect to meeting."
        );
      }

      if (
        !data?.server_url ||
        !data?.participant_token
      ) {
        throw new Error(
          data?.error ||
            "LiveKit token response is incomplete."
        );
      }

      room = new Room();

      liveKitRoomRef.current = room;

      room.on(
        RoomEvent.TrackSubscribed,
        (
          track,
          publication,
          participant
        ) => {
          if (
            track.kind === Track.Kind.Audio
          ) {
            attachAudioTrack(track);
          }

          const person =
            participantToMember(
              participant
            );

          setActiveMembers((old) => {
            const exists = old.some(
              (item) =>
                item.id === person.id
            );

            if (exists) return old;

            return [...old, person];
          });
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track) => {
          removeAudioTrack(track);
        }
      );

      room.on(
        RoomEvent.ParticipantConnected,
        (participant) => {
          const person =
            participantToMember(
              participant
            );

          setActiveMembers((old) => {
            const exists = old.some(
              (item) =>
                item.id === person.id
            );

            if (exists) return old;

            return [...old, person];
          });

          setComments((old) => [
            ...old,
            {
              id: `join-${participant.identity}-${Date.now()}`,
              type: "join",
              name: person.name,
              avatar: person.avatar,
              text: "joined the meeting",
              taggedMemberId: null,
            },
          ]);

          setEntrance({
            name: person.name,
            avatar: person.avatar,
            type: "member",
          });

          window.setTimeout(() => {
            setEntrance(null);
          }, 3500);
        }
      );

      room.on(
        RoomEvent.ParticipantDisconnected,
        (participant) => {
          setActiveMembers((old) =>
            old.filter(
              (person) =>
                person.id !==
                participant.identity
            )
          );

          setSpeakingIds((old) =>
            old.filter(
              (id) =>
                id !== participant.identity
            )
          );

          setSeatAssignments((old) => {
            const next = { ...old };

            Object.keys(next).forEach(
              (seatId) => {
                if (
                  next[seatId]?.id ===
                  participant.identity
                ) {
                  delete next[seatId];
                }
              }
            );

            return next;
          });
        }
      );

      room.on(
        RoomEvent.ActiveSpeakersChanged,
        (speakers) => {
          setSpeakingIds(
            speakers.map(
              (participant) =>
                participant.identity
            )
          );
        }
      );

      /* =========================
         LIVE DATA
      ========================= */

      room.on(
        RoomEvent.DataReceived,
        (
          payload,
          participant,
          kind,
          topic
        ) => {
          try {
            const decoded =
              new TextDecoder().decode(
                payload
              );

            const data = JSON.parse(decoded);

            /* CHAT */

            if (
              topic ===
              "chsdosa-chat"
            ) {
              if (
                data?.type !== "chat" ||
                !data.text
              ) {
                return;
              }

              const messageId =
                data.client_message_id;

              if (
                messageId &&
                processedChatIdsRef.current.has(
                  messageId
                )
              ) {
                return;
              }

              if (messageId) {
                processedChatIdsRef.current.add(
                  messageId
                );
              }

              if (
                data.sender_id &&
                data.sender_id ===
                  currentUser.id
              ) {
                return;
              }

              setComments((old) => [
                ...old,
                {
                  id:
                    messageId ||
                    `remote-message-${Date.now()}-${Math.random()}`,
                  type: "message",
                  name:
                    data.name ||
                    participant?.name ||
                    participant?.identity ||
                    "Member",
                  avatar:
                    data.avatar ||
                    makeAvatar(
                      data.name ||
                        participant?.name ||
                        "Member"
                    ),
                  text: data.text,
                  taggedMemberId:
                    data.taggedMemberId ||
                    null,
                },
              ]);

              return;
            }

            /* SEATS */

            if (
              topic ===
              "chsdosa-seats"
            ) {
              if (
                data?.type ===
                "seat-request"
              ) {
                publishSeatEvent({
                  type: "seat-state",
                  assignments:
                    seatAssignmentsRef.current,
                });

                return;
              }

              if (
                data?.type ===
                "seat-state"
              ) {
                if (
                  data.assignments &&
                  typeof data.assignments ===
                    "object"
                ) {
                  setSeatAssignments(
                    (old) => {
                      const next = {
                        ...old,
                      };

                      Object.entries(
                        data.assignments
                      ).forEach(
                        ([
                          seatId,
                          person,
                        ]) => {
                          if (
                            person?.id
                          ) {
                            next[
                              seatId
                            ] = person;
                          }
                        }
                      );

                      return next;
                    }
                  );
                }

                return;
              }

              if (
                data?.type ===
                "seat-update"
              ) {
                if (!data.seat_id) {
                  return;
                }

                setSeatAssignments(
                  (old) => {
                    const next = {
                      ...old,
                    };

                    if (
                      data.action ===
                      "leave"
                    ) {
                      if (
                        next[
                          data.seat_id
                        ]?.id ===
                          data.person
                            ?.id ||
                        data.person?.id ===
                          currentUser.id
                      ) {
                        delete next[
                          data.seat_id
                        ];
                      }
                    } else if (
                      data.person?.id
                    ) {
                      Object.keys(
                        next
                      ).forEach(
                        (seatId) => {
                          if (
                            next[
                              seatId
                            ]?.id ===
                              data.person.id &&
                            seatId !==
                              data.seat_id
                          ) {
                            delete next[
                              seatId
                            ];
                          }
                        }
                      );

                      next[
                        data.seat_id
                      ] = data.person;
                    }

                    return next;
                  }
                );

                return;
              }

              if (
                data?.type ===
                "seat-clear"
              ) {
                if (!data.person_id) {
                  return;
                }

                setSeatAssignments(
                  (old) => {
                    const next = {
                      ...old,
                    };

                    Object.keys(
                      next
                    ).forEach(
                      (seatId) => {
                        if (
                          next[
                            seatId
                          ]?.id ===
                          data.person_id
                        ) {
                          delete next[
                            seatId
                          ];
                        }
                      }
                    );

                    return next;
                  }
                );

                return;
              }

              if (
                data?.type ===
                "capacity-update"
              ) {
                const amount =
                  Number(data.amount);

                if (
                  [6, 10, 15, 20].includes(
                    amount
                  )
                ) {
                  setSeatCapacity(amount);
                }

                return;
              }
            }

            /* FUN ROOM EVENTS */

            if (
              topic ===
              "chsdosa-fun"
            ) {
              if (
                data.sender_id ===
                currentUser.id
              ) {
                return;
              }

              const remoteName =
                data.name ||
                participant?.name ||
                "Member";

              if (
                data.type ===
                "reaction"
              ) {
                showFunAnimation(
                  data.emoji || "🎉",
                  "reaction",
                  remoteName
                );

                setComments((old) => [
                  ...old,
                  {
                    id: `remote-reaction-${Date.now()}-${Math.random()}`,
                    type: "fun",
                    name: remoteName,
                    avatar:
                      data.avatar ||
                      makeAvatar(
                        remoteName
                      ),
                    text: `${data.emoji || "🎉"} reacted`,
                    taggedMemberId: null,
                  },
                ]);

                return;
              }

              if (
                data.type ===
                "slipper"
              ) {
                showFunAnimation(
                  "🩴",
                  "slipper",
                  remoteName
                );

                setComments((old) => [
                  ...old,
                  {
                    id: `remote-slipper-${Date.now()}-${Math.random()}`,
                    type: "fun",
                    name: remoteName,
                    avatar:
                      data.avatar ||
                      makeAvatar(
                        remoteName
                      ),
                    text: "🩴 threw a slipper!",
                    taggedMemberId: null,
                  },
                ]);

                return;
              }

              if (
                data.type ===
                "gift"
              ) {
                showFunAnimation(
                  data.emoji || "🎁",
                  "gift",
                  remoteName
                );

                setComments((old) => [
                  ...old,
                  {
                    id: `remote-gift-${Date.now()}-${Math.random()}`,
                    type: "fun",
                    name: remoteName,
                    avatar:
                      data.avatar ||
                      makeAvatar(
                        remoteName
                      ),
                    text: `${data.emoji || "🎁"} sent a free ${data.giftName || "gift"}`,
                    taggedMemberId: null,
                  },
                ]);

                return;
              }

              if (
                data.type ===
                "music-start"
              ) {
                startRoomMusic();
                return;
              }

              if (
                data.type ===
                "music-stop"
              ) {
                stopRoomMusic();
                return;
              }
            }
          } catch (error) {
            console.error(
              "Live data error:",
              error
            );
          }
        }
      );

      room.on(
        RoomEvent.Disconnected,
        () => {
          setJoined(false);
          setMuted(true);
          setSelectedSeat(null);
          setSpeakingIds([]);
          setConnectionStatus("");

          stopRoomMusic();

          liveKitRoomRef.current = null;
        }
      );

      await room.connect(
        data.server_url,
        data.participant_token,
        {
          autoSubscribe: true,
        }
      );

      await room.localParticipant.setMicrophoneEnabled(
        false
      );

      try {
        await room.startAudio();
      } catch (audioError) {
        console.log(
          "Audio start notice:",
          audioError
        );
      }

      setJoined(true);
      setMuted(true);
      setConnectionStatus("");

      sessionStorage.setItem(
        "chsdosa-meeting-joined",
        "true"
      );

      setActiveMembers((old) => {
        const exists = old.some(
          (person) =>
            person.id === currentUser.id
        );

        if (exists) return old;

        return [...old, currentUser];
      });

      if (!isAutomaticReconnect) {
        setComments((old) => [
          ...old,
          {
            id: `join-${currentUser.id}-${Date.now()}`,
            type: "join",
            name: currentUser.name,
            avatar: currentUser.avatar,
            text: "joined the meeting",
            taggedMemberId: null,
          },
        ]);

        setEntrance({
          name: currentUser.name,
          avatar: currentUser.avatar,
          type: isMeetingAdmin
            ? "admin"
            : "member",
        });

        window.setTimeout(() => {
          setEntrance(null);
        }, 3500);
      }

      room.remoteParticipants.forEach(
        (participant) => {
          const person =
            participantToMember(
              participant
            );

          setActiveMembers((old) => {
            const exists = old.some(
              (item) =>
                item.id === person.id
            );

            if (exists) return old;

            return [
              ...old,
              person,
            ];
          });
        }
      );

      window.setTimeout(() => {
        publishSeatEvent({
          type: "seat-request",
          requester_id:
            currentUser.id,
        });
      }, 600);
    } catch (error) {
      console.error(
        "Meeting connection error:",
        error
      );

      if (room) {
        try {
          await room.disconnect();
        } catch (disconnectError) {
          console.error(
            "Disconnect error:",
            disconnectError
          );
        }
      }

      liveKitRoomRef.current = null;

      setJoined(false);
      setMuted(true);
      setSelectedSeat(null);
      setConnectionStatus("");

      if (!isAutomaticReconnect) {
        alert(
          error?.message ||
            "Unable to join the meeting. Please try again."
        );
      }
    }
  };

  /* =========================
     AUTO RECONNECT
  ========================= */

  useEffect(() => {
    if (
      loadingMember ||
      !member?.id ||
      reconnectingAfterRefreshRef.current
    ) {
      return;
    }

    const shouldReconnect =
      sessionStorage.getItem(
        "chsdosa-meeting-joined"
      ) === "true";

    if (!shouldReconnect) {
      return;
    }

    reconnectingAfterRefreshRef.current =
      true;

    const timer = setTimeout(() => {
      joinMeeting(true);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [loadingMember, member]);

  /* =========================
     LEAVE
  ========================= */

  const leaveMeeting = async () => {
    sessionStorage.removeItem(
      "chsdosa-meeting-joined"
    );

    stopRoomMusic();

    const room =
      liveKitRoomRef.current;

    if (selectedSeat) {
      await publishSeatEvent({
        type: "seat-clear",
        person_id: currentUser.id,
      });
    }

    try {
      if (room) {
        await room.disconnect();
      }
    } catch (error) {
      console.error(
        "Meeting leave error:",
        error
      );
    }

    liveKitRoomRef.current = null;

    setJoined(false);
    setMuted(true);
    setLockedMic(false);
    setSelectedSeat(null);
    setSpeakingIds([]);
    setConnectionStatus("");
    setShowFunMenu(false);

    setActiveMembers((old) =>
      old.filter(
        (person) =>
          person.id !==
          currentUser.id
      )
    );

    setSeatAssignments((old) => {
      const next = { ...old };

      Object.keys(next).forEach(
        (seatId) => {
          if (
            next[seatId]?.id ===
            currentUser.id
          ) {
            delete next[seatId];
          }
        }
      );

      return next;
    });
  };

  /* =========================
     CLEANUP
  ========================= */

  useEffect(() => {
    return () => {
      stopRoomMusic();

      const room =
        liveKitRoomRef.current;

      if (room) {
        room.disconnect();
        liveKitRoomRef.current =
          null;
      }
    };
  }, []);

  /* =========================
     TAG MEMBER
  ========================= */

  const tagMember = (person) => {
    if (!person?.name || !joined) return;

    const tag = `@${person.name} `;

    setMessage((oldMessage) => {
      const currentText =
        oldMessage || "";

      const existingTag =
        `@${person.name}`;

      if (
        currentText
          .toLowerCase()
          .includes(
            existingTag.toLowerCase()
          )
      ) {
        return currentText;
      }

      if (
        currentText.trim().length === 0
      ) {
        return tag;
      }

      return `${currentText.trimEnd()} ${tag}`;
    });

    setShowActive(false);

    window.setTimeout(() => {
      messageInputRef.current?.focus();

      const input =
        messageInputRef.current;

      if (input) {
        const length =
          input.value.length;

        input.setSelectionRange(
          length,
          length
        );
      }
    }, 100);
  };

  /* =========================
     COMMENT
  ========================= */

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || !joined) {
      return;
    }

    let taggedMemberId = null;

    const firstTagMatch =
      text.match(/^@(.+?)\s/);

    if (firstTagMatch) {
      const taggedName =
        firstTagMatch[1]
          .trim()
          .toLowerCase();

      const taggedPerson =
        [...activeMembers, ...admins].find(
          (person) =>
            person.name
              .trim()
              .toLowerCase() ===
            taggedName
        );

      if (taggedPerson) {
        taggedMemberId =
          taggedPerson.id;
      }
    }

    const localMessage = {
      id: `message-${Date.now()}-${Math.random()}`,
      type: "message",
      name: currentUser.name,
      avatar: currentUser.avatar,
      text,
      taggedMemberId,
    };

    setComments((old) => [
      ...old,
      localMessage,
    ]);

    setMessage("");

    await publishChatMessage(
      text,
      taggedMemberId
    );
  };

  /* =========================
     SEAT
  ========================= */

  const chooseSeat = async (seatId) => {
    if (!joined) {
      alert(
        "Please join the meeting first."
      );

      return;
    }

    const existingPerson =
      seatAssignments[seatId];

    if (
      existingPerson &&
      existingPerson.id !==
        currentUser.id
    ) {
      alert(
        `${existingPerson.name} is already sitting in this seat.`
      );

      return;
    }

    if (
      selectedSeat === seatId ||
      existingPerson?.id ===
        currentUser.id
    ) {
      setSelectedSeat(null);
      setMuted(true);

      const room =
        liveKitRoomRef.current;

      if (room) {
        room.localParticipant
          .setMicrophoneEnabled(false)
          .catch((error) =>
            console.error(
              "Mic disable error:",
              error
            )
          );
      }

      setSeatAssignments((old) => {
        const next = { ...old };
        delete next[seatId];
        return next;
      });

      await publishSeatEvent({
        type: "seat-update",
        action: "leave",
        seat_id: seatId,
        person: buildSeatPerson(
          currentUser
        ),
      });

      return;
    }

    const previousSeat =
      Object.keys(
        seatAssignments
      ).find(
        (id) =>
          seatAssignments[id]?.id ===
          currentUser.id
      );

    const nextAssignments = {
      ...seatAssignments,
    };

    if (previousSeat) {
      delete nextAssignments[
        previousSeat
      ];
    }

    nextAssignments[seatId] =
      buildSeatPerson(
        currentUser
      );

    setSeatAssignments(
      nextAssignments
    );

    setSelectedSeat(seatId);
    setMuted(true);

    const room =
      liveKitRoomRef.current;

    if (room) {
      room.localParticipant
        .setMicrophoneEnabled(false)
        .catch((error) =>
          console.error(
            "Mic disable error:",
            error
          )
        );
    }

    await publishSeatEvent({
      type: "seat-update",
      action: "sit",
      seat_id: seatId,
      person: buildSeatPerson(
        currentUser
      ),
      assignments: nextAssignments,
    });
  };

  /* =========================
     MICROPHONE
  ========================= */

  const toggleMute = async () => {
    if (!selectedSeat) {
      alert(
        "Please choose a seat before speaking."
      );

      return;
    }

    if (lockedMic) {
      alert(
        "Your microphone has been locked by the meeting admin."
      );

      return;
    }

    const room =
      liveKitRoomRef.current;

    if (!room) {
      alert(
        "You are not connected to the meeting."
      );

      return;
    }

    const shouldEnable = muted;

    try {
      await room.localParticipant.setMicrophoneEnabled(
        shouldEnable
      );

      setMuted(!shouldEnable);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Microphone could not be changed. Please check your microphone permission."
      );
    }
  };

  /* =========================
     ADMIN MIC
  ========================= */

  const lockCurrentMemberMic =
    async () => {
      if (!isMeetingAdmin) return;

      setLockedMic(true);
      setMuted(true);

      const room =
        liveKitRoomRef.current;

      if (room) {
        try {
          await room.localParticipant.setMicrophoneEnabled(
            false
          );
        } catch (error) {
          console.error(
            "Mic lock error:",
            error
          );
        }
      }
    };

  const unlockCurrentMemberMic =
    () => {
      if (!isMeetingAdmin) return;

      setLockedMic(false);
    };

  /* =========================
     ADMIN REMOVE SEAT
  ========================= */

  const removeCurrentMemberFromSeat =
    async () => {
      if (!isMeetingAdmin) return;

      if (!selectedSeat) {
        alert(
          "No member is currently selected in your seat."
        );

        return;
      }

      const seatBeingRemoved =
        selectedSeat;

      setSelectedSeat(null);
      setMuted(true);

      const room =
        liveKitRoomRef.current;

      if (room) {
        try {
          await room.localParticipant.setMicrophoneEnabled(
            false
          );
        } catch (error) {
          console.error(
            "Remove from seat mic error:",
            error
          );
        }
      }

      setSeatAssignments((old) => {
        const next = { ...old };

        delete next[seatBeingRemoved];

        return next;
      });

      await publishSeatEvent({
        type: "seat-update",
        action: "leave",
        seat_id: seatBeingRemoved,
        person: buildSeatPerson(
          currentUser
        ),
      });
    };

  /* =========================
     ADMIN SEAT CAPACITY
  ========================= */

  const changeSeatCapacity = async (
    amount
  ) => {
    if (!isMeetingAdmin) return;

    const occupiedOutsideLimit =
      Object.keys(
        seatAssignments
      ).some((seatId) => {
        const number = Number(
          seatId.replace(
            "seat-",
            ""
          )
        );

        return number > amount;
      });

    if (occupiedOutsideLimit) {
      alert(
        "Some seats above the new limit are occupied. Those members must leave their seats first."
      );

      return;
    }

    setSeatCapacity(amount);

    await publishSeatEvent({
      type: "capacity-update",
      amount,
    });

    if (selectedSeat) {
      const seatNumber = Number(
        selectedSeat.replace(
          "seat-",
          ""
        )
      );

      if (seatNumber > amount) {
        setSelectedSeat(null);
        setMuted(true);

        const room =
          liveKitRoomRef.current;

        if (room) {
          room.localParticipant
            .setMicrophoneEnabled(false)
            .catch((error) =>
              console.error(
                "Mic disable error:",
                error
              )
            );
        }
      }
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loadingMember) {
    return (
      <div className="meeting-loading">
        <img
          src={LOGO}
          alt="CHSDOSA"
        />

        <strong>
          Opening meeting...
        </strong>

        <style>{`
          .meeting-loading {
            height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            background: #071a2b;
            color: white;
            font-family: Arial, sans-serif;
          }

          .meeting-loading img {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="meeting-page">

      <div
        ref={audioContainerRef}
        className="audio-container"
        aria-hidden="true"
      />

      <div
        className="live-background"
        aria-hidden="true"
      >
        <div
          className="live-bg-layer visible"
          style={{
            background:
              LIVE_THEMES[
                themeIndex
              ],
          }}
        />

        <div
          className={`live-bg-layer ${
            themeFading
              ? "visible"
              : ""
          }`}
          style={{
            background:
              LIVE_THEMES[
                nextThemeIndex
              ],
          }}
        />
      </div>

      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        body {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input {
          font-family: inherit;
        }

        .audio-container {
          position: fixed;
          width: 1px;
          height: 1px;
          left: -10px;
          top: -10px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        /* =========================
           FULL SCREEN MEETING
        ========================= */

        .meeting-page {
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;

          color: white;

          overflow: hidden;

          position: relative;
          isolation: isolate;

          display: flex;
          flex-direction: column;

          overscroll-behavior: none;
        }

        .live-background {
          position: fixed;
          inset: 0;
          z-index: -3;
          overflow: hidden;
        }

        .live-bg-layer {
          position: absolute;
          inset: 0;
          opacity: 0;

          transition:
            opacity 2.5s
            ease-in-out;
        }

        .live-bg-layer.visible {
          opacity: 1;
        }

        .meeting-page::before {
          content: "";
          position: fixed;
          inset: 0;

          background:
            radial-gradient(
              circle at 50% 8%,
              rgba(255,255,255,.12),
              transparent 32%
            );

          pointer-events: none;
          z-index: -2;
        }

        /* =========================
           HEADER
        ========================= */

        .meeting-header {
          height: 52px;
          min-height: 52px;
          flex: 0 0 52px;

          position: relative;
          z-index: 50;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 6px 9px;

          background:
            rgba(0,0,0,.45);

          backdrop-filter:
            blur(16px);

          border-bottom:
            1px solid
            rgba(255,255,255,.12);
        }

        .back-button,
        .active-button {
          border: 0;
          color: white;
          cursor: pointer;

          background:
            rgba(255,255,255,.12);

          -webkit-tap-highlight-color:
            transparent;
        }

        .back-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
        }

        .active-button {
          padding: 7px 10px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 10px;
        }

        .meeting-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .meeting-title strong {
          font-size: 12px;
        }

        .meeting-title span {
          font-size: 7px;
          opacity: .85;
        }

        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 4px;

          background: #ef4444;
          border-radius: 50%;

          box-shadow:
            0 0 10px
            rgba(239,68,68,.9);
        }

        /* =========================
           MAIN SCREEN
        ========================= */

        .meeting-content {
          width: min(100%, 570px);

          margin: 0 auto;

          flex: 1 1 auto;
          min-height: 0;

          padding:
            5px 7px
            68px;

          position: relative;
          z-index: 2;

          overflow: hidden;

          display: flex;
          flex-direction: column;
        }

        .room-heading {
          text-align: center;

          flex: 0 0 auto;

          margin-bottom: 4px;
        }

        .room-heading h2 {
          margin: 0;

          font-size: 13px;
          line-height: 16px;

          letter-spacing: .4px;
        }

        .room-heading p {
          margin: 1px 0 0;

          font-size: 7px;
          line-height: 9px;

          opacity: .7;
        }

        .room-card {
          padding: 6px;

          border-radius: 13px;

          background:
            rgba(0,0,0,.20);

          border:
            1px solid
            rgba(255,255,255,.10);

          backdrop-filter:
            blur(13px);

          box-shadow:
            0 6px 18px
            rgba(0,0,0,.12);

          flex-shrink: 0;
        }

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 4px;

          font-size: 8px;
          font-weight: 900;
          letter-spacing: .4px;
        }

        .card-heading span:last-child {
          opacity: .65;
          font-size: 6px;
        }

        /* =========================
           ADMINISTRATION
        ========================= */

        .admin-main {
          display: flex;
          justify-content: center;
        }

        .admin-seat {
          text-align: center;
        }

        .main-admin {
          width: 95px;
        }

        .admin-avatar-big {
          width: 55px;
          height: 55px;

          margin: auto;

          position: relative;
        }

        .admin-avatar {
          width: 36px;
          height: 36px;

          margin: auto;

          position: relative;
        }

        .admin-avatar img,
        .admin-avatar-big img {
          width: 100%;
          height: 100%;

          object-fit: cover;
          border-radius: 50%;

          border:
            2px solid
            rgba(255,255,255,.85);
        }

        .admin-avatar-big img {
          border:
            2px solid #facc15;

          box-shadow:
            0 0 0 3px
              rgba(250,204,21,.15),
            0 0 15px
              rgba(250,204,21,.25);
        }

        .crown {
          position: absolute;
          right: -4px;
          bottom: -2px;
          font-size: 15px;
        }

        .small-crown {
          position: absolute;
          right: -4px;
          bottom: -3px;
          font-size: 10px;
        }

        .admin-seat strong {
          display: block;

          margin-top: 2px;

          font-size: 8px;
        }

        .admin-seat small {
          display: block;

          margin-top: 1px;

          font-size: 6px;
          opacity: .65;
        }

        .other-admins {
          display: flex;
          justify-content: center;

          gap: 12px;

          margin-top: 4px;
        }

        /* =========================
           MEMBER SEATS
        ========================= */

        .members-card {
          margin-top: 5px;

          position: relative;

          overflow: hidden;

          flex: 1 1 auto;
          min-height: 0;
        }

        .members-background-logo {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          pointer-events: none;
          z-index: 0;
        }

        .members-background-logo img {
          width: 190px;
          height: 190px;

          object-fit: contain;

          opacity: .085;

          filter:
            drop-shadow(
              0 5px 25px
              rgba(0,0,0,.35)
            );
        }

        .members-card .card-heading,
        .members-card .member-grid {
          position: relative;
          z-index: 2;
        }

        .member-grid {
          width: 100%;
          height: calc(100% - 20px);

          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          grid-template-rows:
            repeat(
              5,
              minmax(0, 1fr)
            );

          gap: 1px 2px;

          overflow: hidden;
        }

        .member-seat {
          min-width: 0;
          min-height: 0;

          padding: 1px;

          border: 0;

          background:
            transparent;

          color: white;

          cursor: pointer;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          -webkit-tap-highlight-color:
            transparent;
        }

        .member-avatar {
          width: clamp(
            28px,
            8vw,
            39px
          );

          height: clamp(
            28px,
            8vw,
            39px
          );

          margin: auto;

          position: relative;

          flex: 0 0 auto;
        }

        .member-avatar img {
          width: 100%;
          height: 100%;

          object-fit: cover;
          border-radius: 50%;

          border:
            2px solid
            rgba(255,255,255,.75);
        }

        .empty-seat {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px dashed
            rgba(255,255,255,.38);

          border-radius: 50%;

          background:
            rgba(255,255,255,.05);

          color:
            rgba(255,255,255,.65);

          font-size: 15px;
        }

        .member-name {
          display: block;

          width: 100%;

          margin-top: 1px;

          font-size: 6px;
          line-height: 7px;

          font-weight: 700;

          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;

          text-align: center;
        }

        .member-status {
          display: block;

          width: 100%;

          margin-top: 1px;

          font-size: 5.5px;
          line-height: 6px;

          color: #86efac;

          font-weight: 700;

          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;

          text-align: center;
        }

        .selected-seat
        .member-avatar img {
          border:
            3px solid #22c55e;

          box-shadow:
            0 0 0 4px
              rgba(34,197,94,.15),
            0 0 15px
              rgba(34,197,94,.30);
        }

        .speaking-ring {
          position: absolute;
          inset: -3px;

          border-radius: 50%;

          border:
            2px solid #22c55e;

          animation:
            speakingPulse 1s infinite;
        }

        @keyframes speakingPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: .9;
          }

          50% {
            transform: scale(1.13);
            opacity: .3;
          }
        }

        /* =========================
           ADMIN TOOLS
        ========================= */

        .admin-tools {
          margin-top: 5px;

          padding: 5px;

          border-radius: 11px;

          background:
            rgba(0,0,0,.30);

          border:
            1px solid
            rgba(250,204,21,.22);

          flex-shrink: 0;
        }

        .admin-tools-title {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 4px;

          font-size: 7px;
          font-weight: 900;
        }

        .seat-capacity-buttons {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 3px;

          margin-bottom: 4px;
        }

        .capacity-button {
          height: 22px;

          border:
            1px solid
            rgba(255,255,255,.14);

          border-radius: 6px;

          background:
            rgba(255,255,255,.07);

          color: white;

          font-size: 7px;

          font-weight: 800;

          cursor: pointer;
        }

        .capacity-button.active {
          background: #0f766e;
          border-color: #22c55e;
        }

        .admin-actions {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 3px;
        }

        .admin-action {
          min-height: 25px;

          border: 0;
          border-radius: 6px;

          color: white;

          background:
            rgba(255,255,255,.10);

          font-size: 6.5px;
          font-weight: 800;

          cursor: pointer;
        }

        .admin-action.danger {
          background:
            rgba(220,38,38,.72);
        }

        .admin-action.success {
          background:
            rgba(15,118,110,.85);
        }

        .admin-tools-note {
          margin: 3px 0 0;

          font-size: 5.5px;

          opacity: .55;

          line-height: 1.2;
        }

        .connection-status {
          margin-top: 3px;

          text-align: center;

          font-size: 7px;

          font-weight: 800;

          color: #fde68a;
        }

        /* =========================
           COMMENTS
        ========================= */

        .comments-card {
          margin-top: 5px;

          flex-shrink: 0;
        }

        .comments-list {
          height: 65px;
          max-height: 65px;

          overflow-y: auto;
          overflow-x: hidden;

          padding-right: 2px;

          scroll-behavior: smooth;

          overscroll-behavior:
            contain;

          scrollbar-width: thin;
        }

        .comment {
          display: flex;
          align-items: flex-start;

          gap: 5px;

          padding: 2px 1px;

          font-size: 8px;
          line-height: 1.2;

          font-weight: 700;
        }

        .comment-avatar {
          width: 19px;
          height: 19px;

          flex: 0 0 19px;
        }

        .comment-avatar img {
          width: 100%;
          height: 100%;

          border-radius: 50%;

          object-fit: cover;
        }

        .comment-name {
          color: #facc15;
          font-weight: 900;
        }

        .tagged-name {
          color: #67e8f9;
          font-weight: 900;

          background:
            rgba(34,211,238,.13);

          padding:
            1px 3px;

          border-radius: 4px;
        }

        .join-comment {
          color: #86efac;

          padding:
            3px 3px;

          border-radius: 5px;

          background:
            rgba(34,197,94,.07);

          font-weight: 800;
        }

        .join-comment .comment-name {
          color: #86efac;
        }

        .join-text {
          opacity: .9;
          font-weight: 800;
        }

        .fun-comment {
          color: #fde68a;
        }

        .message-area {
          display: flex;

          gap: 5px;

          margin-top: 4px;
        }

        .message-input {
          flex: 1;
          min-width: 0;

          height: 30px;

          padding: 0 10px;

          border:
            1px solid
            rgba(255,255,255,.15);

          border-radius: 15px;

          outline: none;

          background:
            rgba(0,0,0,.25);

          color: white;

          font-size: 9px;
        }

        .message-input::placeholder {
          color:
            rgba(255,255,255,.55);
        }

        .send-button {
          width: 30px;
          height: 30px;

          border: 0;
          border-radius: 50%;

          background: #0f766e;

          color: white;

          font-size: 13px;

          cursor: pointer;
        }

        .send-button:disabled {
          opacity: .4;
        }

        /* =========================
           FUN MENU
        ========================= */

        .fun-menu-overlay {
          position: fixed;
          inset: 0;

          z-index: 120;

          pointer-events: none;
        }

        .fun-menu {
          position: fixed;

          left: 50%;

          bottom:
            calc(
              63px +
              env(safe-area-inset-bottom)
            );

          transform:
            translateX(-50%)
            translateY(10px)
            scale(.96);

          width:
            min(
              calc(100vw - 24px),
              430px
            );

          padding: 10px;

          border-radius: 18px;

          background:
            rgba(9,18,31,.96);

          border:
            1px solid
            rgba(255,255,255,.14);

          box-shadow:
            0 15px 45px
            rgba(0,0,0,.55);

          backdrop-filter:
            blur(20px);

          pointer-events: auto;

          animation:
            funMenuIn
            .18s
            ease-out
            forwards;
        }

        @keyframes funMenuIn {
          from {
            opacity: 0;

            transform:
              translateX(-50%)
              translateY(12px)
              scale(.92);
          }

          to {
            opacity: 1;

            transform:
              translateX(-50%)
              translateY(0)
              scale(1);
          }
        }

        .fun-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 8px;

          padding:
            0 2px;
        }

        .fun-menu-title {
          font-size: 10px;
          font-weight: 900;
        }

        .fun-menu-free {
          font-size: 7px;
          color: #86efac;
          font-weight: 800;
        }

        .fun-menu-close {
          width: 25px;
          height: 25px;

          border: 0;
          border-radius: 50%;

          color: white;

          background:
            rgba(255,255,255,.10);

          cursor: pointer;
        }

        .fun-menu-section-title {
          margin:
            5px 2px;

          font-size: 7px;

          color:
            rgba(255,255,255,.55);

          font-weight: 900;
        }

        .fun-menu-grid {
          display: grid;

          grid-template-columns:
            repeat(6, 1fr);

          gap: 5px;
        }

        .fun-menu-button {
          min-width: 0;

          height: 39px;

          border: 0;

          border-radius: 11px;

          color: white;

          background:
            rgba(255,255,255,.08);

          cursor: pointer;

          font-size: 19px;

          transition:
            transform .12s ease,
            background .12s ease;

          -webkit-tap-highlight-color:
            transparent;
        }

        .fun-menu-button:active {
          transform: scale(.84);

          background:
            rgba(15,118,110,.8);
        }

        .fun-menu-action {
          height: 38px;

          border: 0;

          border-radius: 10px;

          color: white;

          background:
            rgba(255,255,255,.08);

          font-size: 9px;

          font-weight: 900;

          cursor: pointer;
        }

        .fun-menu-action.music-active {
          background:
            #0f766e;
        }

        .fun-menu-bottom {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 5px;

          margin-top: 5px;
        }

        /* =========================
           BOTTOM CONTROLS
        ========================= */

        .controls {
          position: fixed;

          left: 0;
          right: 0;
          bottom: 0;

          z-index: 130;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 6px;

          min-height: 60px;

          padding:
            6px 6px
            calc(
              6px +
              env(safe-area-inset-bottom)
            );

          background:
            rgba(0,0,0,.78);

          backdrop-filter:
            blur(18px);

          border-top:
            1px solid
            rgba(255,255,255,.1);
        }

        .control {
          width: 40px;
          height: 40px;

          flex: 0 0 40px;

          border: 0;
          border-radius: 50%;

          color: white;

          background:
            rgba(255,255,255,.12);

          font-size: 16px;

          cursor: pointer;

          -webkit-tap-highlight-color:
            transparent;
        }

        .control.active {
          background: #0f766e;
        }

        .fun-main-button {
          position: relative;
        }

        .fun-main-button.open {
          background:
            #0f766e;

          box-shadow:
            0 0 0 4px
              rgba(15,118,110,.18);
        }

        .fun-badge {
          position: absolute;

          right: -1px;
          top: -2px;

          width: 13px;
          height: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #facc15;

          color: #111827;

          font-size: 7px;
        }

        .join-button {
          height: 43px;

          padding:
            0 28px;

          border: 0;

          border-radius: 22px;

          color: white;

          background: #0f766e;

          font-weight: 900;
          font-size: 11px;

          cursor: pointer;

          box-shadow:
            0 8px 25px
            rgba(15,118,110,.35);
        }

        .leave-button {
          height: 40px;

          padding:
            0 13px;

          flex: 0 0 auto;

          border: 0;

          border-radius: 21px;

          color: white;

          background: #dc2626;

          font-weight: 900;

          font-size: 9px;

          cursor: pointer;
        }

        /* =========================
           FLOATING FUN
        ========================= */

        .fun-animation-layer {
          position: fixed;
          inset: 0;

          z-index: 180;

          pointer-events: none;

          overflow: hidden;
        }

        .fun-animation {
          position: absolute;

          left: 50%;
          top: 58%;

          font-size: 38px;

          text-shadow:
            0 4px 18px
            rgba(0,0,0,.5);
        }

        .fun-animation.reaction {
          animation:
            reactionFloat
            2.5s
            ease-out
            forwards;
        }

        .fun-animation.gift {
          animation:
            giftFloat
            2.5s
            ease-out
            forwards;
        }

        .fun-animation.slipper {
          animation:
            slipperThrow
            2.5s
            cubic-bezier(.2,.7,.2,1)
            forwards;
        }

        @keyframes reactionFloat {
          0% {
            opacity: 0;

            transform:
              translate(-50%, 80px)
              scale(.4)
              rotate(-15deg);
          }

          15% {
            opacity: 1;
          }

          100% {
            opacity: 0;

            transform:
              translate(
                calc(-50% + 80px),
                -220px
              )
              scale(1.7)
              rotate(18deg);
          }
        }

        @keyframes giftFloat {
          0% {
            opacity: 0;

            transform:
              translate(-50%, 100px)
              scale(.3)
              rotate(-20deg);
          }

          20% {
            opacity: 1;
          }

          100% {
            opacity: 0;

            transform:
              translate(
                calc(-50% - 100px),
                -250px
              )
              scale(1.5)
              rotate(25deg);
          }
        }

        @keyframes slipperThrow {
          0% {
            opacity: 0;

            transform:
              translate(-50%, 100px)
              rotate(-70deg)
              scale(.5);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 0;

            transform:
              translate(
                calc(-50% + 180px),
                -180px
              )
              rotate(540deg)
              scale(1.25);
          }
        }

        /* =========================
           ACTIVE MEMBERS
        ========================= */

        .active-overlay {
          position: fixed;
          inset: 0;

          z-index: 200;

          display: flex;
          justify-content: flex-end;

          background:
            rgba(0,0,0,.72);

          backdrop-filter:
            blur(8px);
        }

        .active-panel {
          width:
            min(88%, 380px);

          height: 100%;

          overflow-y: auto;

          padding: 16px;

          background: #101827;

          box-shadow:
            -10px 0 40px
            rgba(0,0,0,.4);

          animation:
            activePanelIn
            .25s
            ease;
        }

        @keyframes activePanelIn {
          from {
            transform:
              translateX(100%);
          }

          to {
            transform:
              translateX(0);
          }
        }

        .active-header {
          display: flex;

          justify-content: space-between;
          align-items: center;

          padding-bottom: 13px;

          border-bottom:
            1px solid
            rgba(255,255,255,.1);
        }

        .active-header strong {
          font-size: 16px;
        }

        .close-active {
          width: 36px;
          height: 36px;

          border: 0;

          border-radius: 50%;

          color: white;

          background:
            rgba(255,255,255,.1);

          cursor: pointer;
        }

        .active-person {
          display: flex;

          align-items: center;

          gap: 10px;

          padding: 10px 2px;

          border-bottom:
            1px solid
            rgba(255,255,255,.06);

          cursor: pointer;

          border-radius: 9px;
        }

        .active-person:active {
          background:
            rgba(15,118,110,.25);
        }

        .active-person img {
          width: 42px;
          height: 42px;

          object-fit: cover;

          border-radius: 50%;

          border:
            2px solid #22c55e;
        }

        .active-person-info {
          flex: 1;
        }

        .active-person-info strong {
          display: block;
          font-size: 12px;
        }

        .active-person-info span {
          display: block;

          margin-top: 2px;

          font-size: 9px;

          color: #86efac;
        }

        .tag-hint {
          margin-top: 4px;

          font-size: 7px;

          color: #67e8f9;

          font-weight: 800;
        }

        /* =========================
           ENTRANCE
        ========================= */

        .entrance-overlay {
          position: fixed;
          inset: 0;

          z-index: 220;

          display: flex;

          align-items: center;
          justify-content: center;

          pointer-events: none;

          background:
            radial-gradient(
              circle,
              rgba(15,118,110,.28),
              rgba(0,0,0,.08) 45%,
              transparent 75%
            );

          animation:
            entranceFade
            3.5s
            ease
            forwards;
        }

        .entrance-card {
          text-align: center;

          animation:
            entranceZoom
            3.5s
            ease
            forwards;
        }

        .entrance-icon {
          font-size: 50px;

          margin-bottom: -10px;

          animation:
            entranceVehicle
            1s
            ease-in-out
            infinite
            alternate;
        }

        .entrance-icon.admin {
          animation:
            entranceHorse
            1s
            ease-in-out
            infinite
            alternate;
        }

        .entrance-avatar {
          width: 125px;
          height: 125px;

          object-fit: cover;

          border-radius: 50%;

          border:
            5px solid white;

          box-shadow:
            0 0 0 8px
              rgba(255,255,255,.12),
            0 0 50px
              rgba(34,197,94,.65);
        }

        .entrance-name {
          margin-top: 14px;

          font-size: 25px;

          font-weight: 900;

          text-shadow:
            0 4px 18px
            rgba(0,0,0,.55);
        }

        .entrance-message {
          margin-top: 5px;

          font-size: 12px;

          font-weight: 800;

          letter-spacing: 1px;

          color: #86efac;
        }

        @keyframes entranceZoom {
          0% {
            opacity: 0;
            transform: scale(.35);
          }

          18% {
            opacity: 1;
            transform: scale(1.08);
          }

          35% {
            transform: scale(1);
          }

          75% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: scale(1.18);
          }
        }

        @keyframes entranceFade {
          0% {
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          75% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes entranceVehicle {
          from {
            transform:
              translateY(0)
              rotate(-5deg);
          }

          to {
            transform:
              translateY(-8px)
              rotate(5deg);
          }
        }

        @keyframes entranceHorse {
          from {
            transform:
              translateY(2px)
              rotate(-3deg)
              scale(1);
          }

          to {
            transform:
              translateY(-8px)
              rotate(3deg)
              scale(1.06);
          }
        }

        /* =========================
           SMALL PHONES
        ========================= */

        @media (max-width: 380px) {

          .meeting-content {
            padding-left: 5px;
            padding-right: 5px;
            padding-bottom: 66px;
          }

          .meeting-header {
            height: 49px;
            min-height: 49px;
            flex-basis: 49px;
          }

          .member-avatar {
            width: 29px;
            height: 29px;
          }

          .admin-avatar {
            width: 32px;
            height: 32px;
          }

          .admin-avatar-big {
            width: 48px;
            height: 48px;
          }

          .members-background-logo img {
            width: 160px;
            height: 160px;
          }

          .comments-list {
            height: 58px;
            max-height: 58px;
          }

          .other-admins {
            gap: 7px;
          }

          .comment {
            font-size: 7px;
          }

          .comment-avatar {
            width: 18px;
            height: 18px;
            flex-basis: 18px;
          }

          .control {
            width: 37px;
            height: 37px;
            flex-basis: 37px;
            font-size: 15px;
          }

          .leave-button {
            height: 37px;
            padding: 0 10px;
            font-size: 8px;
          }

          .fun-menu {
            bottom:
              calc(
                58px +
                env(safe-area-inset-bottom)
              );

            padding: 8px;
          }

          .fun-menu-button {
            height: 35px;
            font-size: 17px;
          }
        }

        /* =========================
           SHORT PHONE HEIGHT
        ========================= */

        @media (max-height: 680px) {

          .meeting-content {
            padding-top: 3px;
            padding-bottom: 63px;
          }

          .room-heading {
            margin-bottom: 2px;
          }

          .room-heading h2 {
            font-size: 11px;
            line-height: 13px;
          }

          .room-heading p {
            font-size: 6px;
            line-height: 7px;
          }

          .room-card {
            padding: 4px;
            border-radius: 10px;
          }

          .card-heading {
            font-size: 7px;
            margin-bottom: 2px;
          }

          .admin-avatar-big {
            width: 45px;
            height: 45px;
          }

          .admin-avatar {
            width: 30px;
            height: 30px;
          }

          .other-admins {
            margin-top: 2px;
          }

          .members-card {
            margin-top: 3px;
          }

          .comments-card {
            margin-top: 3px;
          }

          .comments-list {
            height: 48px;
            max-height: 48px;
          }

          .message-input,
          .send-button {
            height: 27px;
          }

          .controls {
            min-height: 55px;
          }

          .control {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
          }

          .leave-button {
            height: 36px;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .live-bg-layer {
            transition: none;
          }

          .speaking-ring,
          .entrance-card,
          .entrance-overlay,
          .entrance-icon,
          .fun-animation,
          .fun-menu {
            animation: none;
          }

        }

      `}</style>

      {/* =========================
          HEADER
      ========================= */}

      <header className="meeting-header">

        <button
          className="back-button"
          onClick={async () => {
            if (joined) {
              await leaveMeeting();
            }

            navigate("/dashboard");
          }}
        >
          ←
        </button>

        <div className="meeting-title">

          <strong>
            CHSDOSA LIVE
          </strong>

          <span>
            <span className="live-dot" />
            LIVE MEETING
          </span>

        </div>

        <button
          className="active-button"
          onClick={() =>
            setShowActive(true)
          }
        >
          👥{" "}
          {activeMembers.length + 4}
        </button>

      </header>

      {/* =========================
          FLOATING FUN ANIMATIONS
      ========================= */}

      <div
        className="fun-animation-layer"
        aria-hidden="true"
      >
        {funAnimations.map(
          (item) => (
            <div
              key={item.id}
              className={`fun-animation ${item.type}`}
              title={item.name}
            >
              {item.emoji}
            </div>
          )
        )}
      </div>

      {/* =========================
          MAIN
      ========================= */}

      <main className="meeting-content">

        <div className="room-heading">

          <h2>
            CHSDOSA COOPERATIVE
          </h2>

          <p>
            Leadership with Integrity,
            Unity and Progress
          </p>

          {connectionStatus && (
            <div className="connection-status">
              {connectionStatus}
            </div>
          )}

        </div>

        {/* =========================
            ADMINISTRATION
        ========================= */}

        <section className="room-card">

          <div className="card-heading">

            <span>
              👑 ADMINISTRATION
            </span>

            <span>
              4 ADMIN SEATS
            </span>

          </div>

          <div className="admin-main">

            <div className="admin-seat main-admin">

              <div className="admin-avatar-big">

                <img
                  src={admins[0].avatar}
                  alt={admins[0].name}
                />

                <span className="crown">
                  👑
                </span>

              </div>

              <strong>
                {admins[0].name}
              </strong>

              <small>
                {admins[0].role}
              </small>

            </div>

          </div>

          <div className="other-admins">

            {admins.slice(1).map(
              (admin) => (

                <div
                  className="admin-seat"
                  key={admin.id}
                >

                  <div className="admin-avatar">

                    <img
                      src={admin.avatar}
                      alt={admin.name}
                    />

                    <span className="small-crown">
                      👑
                    </span>

                  </div>

                  <strong>
                    {admin.name}
                  </strong>

                  <small>
                    {admin.role}
                  </small>

                </div>

              )
            )}

          </div>

        </section>

        {/* =========================
            MEMBER SEATS
        ========================= */}

        <section className="room-card members-card">

          <div className="members-background-logo">

            <img
              src={LOGO}
              alt=""
              aria-hidden="true"
            />

          </div>

          <div className="card-heading">

            <span>
              👥 MEMBER SEATS
            </span>

            <span>
              {seatCapacity} SEATS
            </span>

          </div>

          <div className="member-grid">

            {memberSeats.map(
              (seat) => {

                const seatedPerson =
                  seatAssignments[
                    seat.id
                  ];

                const selected =
                  seatedPerson?.id ===
                  currentUser.id;

                const isSpeaking =
                  seatedPerson &&
                  speakingIds.includes(
                    seatedPerson.id
                  );

                return (

                  <button
                    key={seat.id}
                    className={`member-seat ${
                      selected
                        ? "selected-seat"
                        : ""
                    }`}
                    onClick={() =>
                      chooseSeat(
                        seat.id
                      )
                    }
                  >

                    <div className="member-avatar">

                      {seatedPerson ? (

                        <>
                          <img
                            src={
                              seatedPerson.avatar
                            }
                            alt={
                              seatedPerson.name
                            }
                          />

                          {isSpeaking && (
                            <span className="speaking-ring" />
                          )}
                        </>

                      ) : (

                        <div className="empty-seat">
                          +
                        </div>

                      )}

                    </div>

                    <span className="member-name">

                      {seatedPerson
                        ? seatedPerson.name
                        : `Seat ${seat.number}`}

                    </span>

                    {seatedPerson && (
                      <span className="member-status">

                        {selected
                          ? lockedMic
                            ? "🔒 Mic locked"
                            : muted
                            ? "🔇 Muted"
                            : "🎙️ Speaking"
                          : isSpeaking
                          ? "🎙️ Speaking"
                          : "🟢 Seated"}

                      </span>
                    )}

                  </button>

                );
              }
            )}

          </div>

        </section>

        {/* =========================
            ADMIN CONTROLS
        ========================= */}

        {isMeetingAdmin && (

          <section className="admin-tools">

            <div className="admin-tools-title">

              <span>
                🛡️ MEETING ADMIN CONTROLS
              </span>

              <span>
                {adminUser.role?.toUpperCase()}
              </span>

            </div>

            <div
              style={{
                fontSize: 6,
                opacity: .7,
                marginBottom: 3,
              }}
            >
              MEMBER SEAT CAPACITY
            </div>

            <div className="seat-capacity-buttons">

              {[6, 10, 15, 20].map(
                (amount) => (

                  <button
                    key={amount}
                    className={`capacity-button ${
                      seatCapacity ===
                      amount
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      changeSeatCapacity(
                        amount
                      )
                    }
                  >
                    {amount}
                  </button>

                )
              )}

            </div>

            <div className="admin-actions">

              <button
                className="admin-action"
                onClick={
                  lockedMic
                    ? unlockCurrentMemberMic
                    : lockCurrentMemberMic
                }
              >
                {lockedMic
                  ? "🔓 Unlock"
                  : "🔇 Lock Mic"}
              </button>

              <button
                className="admin-action danger"
                onClick={
                  removeCurrentMemberFromSeat
                }
              >
                ⬇️ Remove
              </button>

              <button
                className="admin-action success"
                onClick={async () => {

                  if (!joined) {
                    alert(
                      "Member must join the meeting first."
                    );

                    return;
                  }

                  if (selectedSeat) {
                    alert(
                      "Member is already seated."
                    );

                    return;
                  }

                  const occupiedSeats =
                    Object.keys(
                      seatAssignments
                    );

                  const firstAvailable =
                    memberSeats.find(
                      (seat) =>
                        !occupiedSeats.includes(
                          seat.id
                        )
                    );

                  if (!firstAvailable) {
                    alert(
                      "There are no empty seats."
                    );

                    return;
                  }

                  await chooseSeat(
                    firstAvailable.id
                  );

                }}
              >
                🪑 Assign
              </button>

              <button
                className="admin-action"
                onClick={() =>
                  setShowActive(true)
                }
              >
                👥 Active
              </button>

            </div>

            <p className="admin-tools-note">
              Removing a member from a seat
              does not remove the member from
              the meeting.
            </p>

          </section>

        )}

        {/* =========================
            COMMENTS
        ========================= */}

        <section className="room-card comments-card">

          <div className="card-heading">

            <span>
              💬 COMMENTS
            </span>

            <span>
              LIVE CHAT
            </span>

          </div>

          <div
            ref={commentsListRef}
            className="comments-list"
          >

            {comments.map(
              (comment) => {

                const taggedName =
                  comment.text
                    ?.match(
                      /^(@.+?)\s/
                    )?.[1];

                let commentText =
                  comment.text || "";

                if (
                  taggedName &&
                  comment.taggedMemberId
                ) {
                  commentText =
                    comment.text.slice(
                      taggedName.length
                    );
                }

                return (

                  <div
                    key={comment.id}
                    className={
                      comment.type ===
                      "join"
                        ? "comment join-comment"
                        : comment.type ===
                          "fun"
                        ? "comment fun-comment"
                        : "comment"
                    }
                  >

                    <div className="comment-avatar">

                      <img
                        src={
                          comment.avatar ||
                          makeAvatar(
                            comment.name
                          )
                        }
                        alt={
                          comment.name
                        }
                      />

                    </div>

                    <div>

                      <span className="comment-name">
                        {comment.name}
                      </span>

                      {comment.type ===
                      "join" ? (

                        <span className="join-text">
                          {" "}
                          joined the meeting
                        </span>

                      ) : (

                        <>
                          :{" "}

                          {comment.taggedMemberId &&
                          taggedName ? (
                            <>
                              <span className="tagged-name">
                                {taggedName}
                              </span>

                              {commentText}
                            </>
                          ) : (
                            comment.text
                          )}
                        </>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

          <div className="message-area">

            <input
              ref={messageInputRef}
              className="message-input"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (
                  event.key ===
                  "Enter"
                ) {
                  sendMessage();
                }

              }}
              disabled={!joined}
              placeholder={
                joined
                  ? "Say something..."
                  : "Join the meeting to comment"
              }
            />

            <button
              className="send-button"
              disabled={
                !joined ||
                !message.trim()
              }
              onClick={sendMessage}
            >
              ➤
            </button>

          </div>

        </section>

      </main>

      {/* =========================
          FUN MENU POPUP
      ========================= */}

      {showFunMenu && (

        <div
          className="fun-menu-overlay"
          onClick={() =>
            setShowFunMenu(false)
          }
        >

          <div
            className="fun-menu"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="fun-menu-header">

              <div>

                <div className="fun-menu-title">
                  🎉 ROOM FUN
                </div>

                <div className="fun-menu-free">
                  FREE • NO MONEY
                </div>

              </div>

              <button
                className="fun-menu-close"
                onClick={() =>
                  setShowFunMenu(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="fun-menu-section-title">
              REACTIONS
            </div>

            <div className="fun-menu-grid">

              {REACTIONS.map(
                (emoji) => (

                  <button
                    key={emoji}
                    className="fun-menu-button"
                    onClick={() =>
                      sendReaction(emoji)
                    }
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>

                )
              )}

            </div>

            <div className="fun-menu-section-title">
              FUN
            </div>

            <div className="fun-menu-grid">

              <button
                className="fun-menu-button"
                onClick={throwSlipper}
                title="Throw slipper"
              >
                🩴
              </button>

              {GIFTS.map(
                (gift) => (

                  <button
                    key={gift.name}
                    className="fun-menu-button"
                    onClick={() =>
                      sendGift(gift)
                    }
                    title={`Send free ${gift.name}`}
                  >
                    {gift.emoji}
                  </button>

                )
              )}

            </div>

            <div className="fun-menu-section-title">
              MUSIC
            </div>

            <div className="fun-menu-bottom">

              <button
                className={`fun-menu-action ${
                  musicPlaying
                    ? "music-active"
                    : ""
                }`}
                onClick={() =>
                  toggleRoomMusic()
                }
              >
                {musicPlaying
                  ? "⏸️ STOP MUSIC"
                  : "🎵 PLAY MUSIC"}
              </button>

              <button
                className="fun-menu-action"
                onClick={() =>
                  setShowFunMenu(false)
                }
              >
                ✓ CLOSE
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          BOTTOM CONTROLS
      ========================= */}

      <footer className="controls">

        {!joined ? (

          <button
            className="join-button"
            onClick={joinMeeting}
            disabled={
              Boolean(
                connectionStatus
              )
            }
          >
            {connectionStatus
              ? "CONNECTING..."
              : "🎙️ JOIN MEETING"}
          </button>

        ) : (

          <>

            {/* MIC */}

            <button
              className={`control ${
                !muted &&
                selectedSeat &&
                !lockedMic
                  ? "active"
                  : ""
              }`}
              onClick={
                toggleMute
              }
            >
              {lockedMic
                ? "🔒"
                : muted
                ? "🔇"
                : "🎙️"}
            </button>

            {/* SEAT */}

            <button
              className={`control ${
                selectedSeat
                  ? "active"
                  : ""
              }`}
              onClick={async () => {

                if (
                  selectedSeat
                ) {
                  const seatId =
                    selectedSeat;

                  setSelectedSeat(
                    null
                  );

                  setMuted(true);

                  const room =
                    liveKitRoomRef.current;

                  if (room) {
                    try {
                      await room.localParticipant.setMicrophoneEnabled(
                        false
                      );
                    } catch (error) {
                      console.error(
                        "Mic disable error:",
                        error
                      );
                    }
                  }

                  setSeatAssignments(
                    (old) => {
                      const next = {
                        ...old,
                      };

                      delete next[
                        seatId
                      ];

                      return next;
                    }
                  );

                  await publishSeatEvent({
                    type: "seat-update",
                    action: "leave",
                    seat_id: seatId,
                    person:
                      buildSeatPerson(
                        currentUser
                      ),
                  });

                } else {

                  alert(
                    "Tap an empty seat above to sit down."
                  );

                }

              }}
            >
              🪑
            </button>

            {/* COMMENTS */}

            <button
              className="control"
              onClick={() => {

                const list =
                  commentsListRef.current;

                if (list) {
                  list.scrollTo({
                    top:
                      list.scrollHeight,
                    behavior:
                      "smooth",
                  });
                }

                messageInputRef.current?.focus();

              }}
            >
              💬
            </button>

            {/* FUN */}

            <button
              className={`control fun-main-button ${
                showFunMenu
                  ? "open"
                  : ""
              }`}
              onClick={() =>
                setShowFunMenu(
                  (old) => !old
                )
              }
              aria-label="Open room fun"
              title="Room Fun"
            >
              🎉

              {!showFunMenu && (
                <span className="fun-badge">
                  +
                </span>
              )}

            </button>

            {/* ACTIVE MEMBERS */}

            <button
              className="control"
              onClick={() =>
                setShowActive(true)
              }
            >
              👥
            </button>

            {/* LEAVE */}

            <button
              className="leave-button"
              onClick={
                leaveMeeting
              }
            >
              LEAVE
            </button>

          </>

        )}

      </footer>

      {/* =========================
          ACTIVE MEMBERS
      ========================= */}

      {showActive && (

        <div
          className="active-overlay"
          onClick={() =>
            setShowActive(false)
          }
        >

          <div
            className="active-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="active-header">

              <strong>
                👥 Active Members
              </strong>

              <button
                className="close-active"
                onClick={() =>
                  setShowActive(false)
                }
              >
                ✕
              </button>

            </div>

            {admins.map(
              (admin) => (

                <div
                  className="active-person"
                  key={admin.id}
                  onClick={() =>
                    tagMember(admin)
                  }
                  title={`Tag ${admin.name}`}
                >

                  <img
                    src={admin.avatar}
                    alt={admin.name}
                  />

                  <div className="active-person-info">

                    <strong>
                      {admin.name}
                    </strong>

                    <span>
                      🟢{" "}
                      {admin.role}
                    </span>

                    <div className="tag-hint">
                      Tap to tag
                    </div>

                  </div>

                </div>

              )
            )}

            {activeMembers.map(
              (person) => {

                const seated =
                  Object.values(
                    seatAssignments
                  ).some(
                    (seatPerson) =>
                      seatPerson?.id ===
                      person.id
                  );

                return (

                  <div
                    className="active-person"
                    key={person.id}
                    onClick={() =>
                      tagMember(person)
                    }
                    title={`Tag ${person.name}`}
                  >

                    <img
                      src={
                        person.avatar
                      }
                      alt={
                        person.name
                      }
                    />

                    <div className="active-person-info">

                      <strong>
                        {person.name}
                      </strong>

                      <span>
                        {speakingIds.includes(
                          person.id
                        )
                          ? "🎙️ Speaking"
                          : seated
                          ? "🪑 Seated"
                          : "🟢 Active now"}
                      </span>

                      <div className="tag-hint">
                        Tap to tag
                      </div>

                    </div>

                  </div>

                );
              }
            )}

            {activeMembers.length ===
              0 && (

              <p
                style={{
                  textAlign:
                    "center",
                  opacity: .55,
                  fontSize: 12,
                  marginTop: 25,
                }}
              >
                No members have joined yet.
              </p>

            )}

          </div>

        </div>

      )}

      {/* =========================
          ENTRANCE
      ========================= */}

      {entrance && (

        <div className="entrance-overlay">

          <div className="entrance-card">

            <div
              className={`entrance-icon ${
                entrance.type ===
                "admin"
                  ? "admin"
                  : ""
              }`}
            >
              {entrance.type ===
              "admin"
                ? "🐎🪖"
                : "🚗✨"}
            </div>

            <img
              className="entrance-avatar"
              src={entrance.avatar}
              alt={entrance.name}
            />

            <div className="entrance-name">
              {entrance.name}
            </div>

            <div className="entrance-message">
              🟢 JOINED THE MEETING
            </div>

          </div>

        </div>

      )}

    </div>
  );
}