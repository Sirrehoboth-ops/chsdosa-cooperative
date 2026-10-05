import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const APP_LOGO =
  "/chsdosa-cooperative/chsdosa-icon.png";

function Profile() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);
  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("chsdosa-dark-mode") ===
      "true"
    );
  });

  const [editing, setEditing] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);

  /*
   * PROFILE PHOTO VIEWER
   */
  const [showPhotoViewer, setShowPhotoViewer] =
    useState(false);

  /*
   * PHOTO CROPPER
   */
  const [showCropper, setShowCropper] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [cropZoom, setCropZoom] = useState(1);

  const [cropPosition, setCropPosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [draggingCrop, setDraggingCrop] =
    useState(false);

  const [cropStart, setCropStart] = useState({
    x: 0,
    y: 0,
  });

  const [cropStartPosition, setCropStartPosition] =
    useState({
      x: 0,
      y: 0,
    });

  /*
   * PASSWORD VERIFICATION
   */
  const [
    showPasswordVerification,
    setShowPasswordVerification,
  ] = useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [verifyingPassword, setVerifyingPassword] =
    useState(false);

  /*
   * LOAD MEMBER
   */
  const loadProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("members")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "PROFILE LOAD ERROR:",
          error
        );

        alert(
          "Unable to load your profile."
        );

        return;
      }

      if (data) {
        setMember(data);

        setFullName(
          data.full_name || ""
        );

        setPhone(
          data.phone || ""
        );

        setEmail(
          data.email ||
            user.email ||
            ""
        );
      }
    } catch (error) {
      console.error(
        "PROFILE ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /*
   * SAVE DARK MODE
   */
  useEffect(() => {
    localStorage.setItem(
      "chsdosa-dark-mode",
      String(darkMode)
    );
  }, [darkMode]);

  /*
   * CLEAN OBJECT URL
   */
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(
          selectedImage
        );
      }
    };
  }, [selectedImage]);

  /*
   * OPEN EDITING
   *
   * Account information requires
   * password verification first.
   */
  const handleStartEditing = () => {
    setCurrentPassword("");
    setShowPasswordVerification(true);
  };

  /*
   * VERIFY CURRENT PASSWORD
   */
  const verifyPasswordAndEdit =
    async () => {
      if (!currentPassword.trim()) {
        alert(
          "Please enter your current password."
        );
        return;
      }

      try {
        setVerifyingPassword(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (!user || !user.email) {
          navigate("/login", {
            replace: true,
          });
          return;
        }

        const {
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email: user.email,
              password:
                currentPassword,
            }
          );

        if (error) {
          console.error(
            "PASSWORD VERIFICATION ERROR:",
            error
          );

          alert(
            "Incorrect password. Your profile has not been opened for editing."
          );

          return;
        }

        setShowPasswordVerification(
          false
        );

        setEditing(true);
        setCurrentPassword("");

        alert(
          "Password verified. You can now edit your profile."
        );
      } catch (error) {
        console.error(
          "PASSWORD VERIFY ERROR:",
          error
        );

        alert(
          "Unable to verify your password. Please try again."
        );
      } finally {
        setVerifyingPassword(
          false
        );
      }
    };

  /*
   * CANCEL EDITING
   */
  const handleCancelEditing = () => {
    setEditing(false);

    setFullName(
      member?.full_name || ""
    );

    setPhone(
      member?.phone || ""
    );

    setEmail(
      member?.email || ""
    );
  };

  /*
   * SELECT PROFILE PHOTO
   *
   * Selecting the photo does NOT upload
   * immediately. It first opens the cropper.
   */
  const handleProfileUpload = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      alert(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Please choose an image smaller than 5MB."
      );

      event.target.value = "";
      return;
    }

    try {
      const imageUrl =
        URL.createObjectURL(file);

      setSelectedImage(imageUrl);

      setCropZoom(1);

      setCropPosition({
        x: 0,
        y: 0,
      });

      setShowCropper(true);
    } catch (error) {
      console.error(
        "IMAGE PREVIEW ERROR:",
        error
      );

      alert(
        "Unable to open this picture."
      );
    } finally {
      event.target.value = "";
    }
  };

  /*
   * START CROP DRAG
   */
  const handleCropPointerDown =
    (event) => {
      if (uploadingPhoto) return;

      event.currentTarget.setPointerCapture?.(
        event.pointerId
      );

      setDraggingCrop(true);

      setCropStart({
        x: event.clientX,
        y: event.clientY,
      });

      setCropStartPosition({
        ...cropPosition,
      });
    };

  /*
   * MOVE CROP
   */
  const handleCropPointerMove =
    (event) => {
      if (!draggingCrop) return;

      const dx =
        event.clientX -
        cropStart.x;

      const dy =
        event.clientY -
        cropStart.y;

      setCropPosition({
        x:
          cropStartPosition.x +
          dx,
        y:
          cropStartPosition.y +
          dy,
      });
    };

  /*
   * END CROP DRAG
   */
  const handleCropPointerUp = (
    event
  ) => {
    try {
      event.currentTarget.releasePointerCapture?.(
        event.pointerId
      );
    } catch {}

    setDraggingCrop(false);
  };

  /*
   * CROP + UPLOAD PROFILE PHOTO
   */
  const createCroppedImage =
    async () => {
      if (!selectedImage) return;

      try {
        setUploadingPhoto(true);

        const image =
          new Image();

        image.onload = async () => {
          try {
            const canvas =
              document.createElement(
                "canvas"
              );

            const ctx =
              canvas.getContext(
                "2d"
              );

            if (!ctx) {
              throw new Error(
                "Canvas is not supported."
              );
            }

            /*
             * Final image:
             * 800 x 800 JPEG
             */
            const outputSize = 800;

            canvas.width =
              outputSize;

            canvas.height =
              outputSize;

            const imageRatio =
              image.width /
              image.height;

            let drawWidth;
            let drawHeight;

            if (
              imageRatio > 1
            ) {
              drawHeight =
                outputSize;

              drawWidth =
                image.width *
                (outputSize /
                  image.height);
            } else {
              drawWidth =
                outputSize;

              drawHeight =
                image.height *
                (outputSize /
                  image.width);
            }

            drawWidth *=
              cropZoom;

            drawHeight *=
              cropZoom;

            const centerX =
              (outputSize -
                drawWidth) /
                2 +
              cropPosition.x;

            const centerY =
              (outputSize -
                drawHeight) /
                2 +
              cropPosition.y;

            ctx.clearRect(
              0,
              0,
              outputSize,
              outputSize
            );

            ctx.drawImage(
              image,
              centerX,
              centerY,
              drawWidth,
              drawHeight
            );

            canvas.toBlob(
              async (blob) => {
                try {
                  if (!blob) {
                    throw new Error(
                      "Unable to create cropped image."
                    );
                  }

                  const {
                    data: {
                      session,
                    },
                  } =
                    await supabase.auth.getSession();

                  const user =
                    session?.user;

                  if (!user) {
                    navigate(
                      "/login",
                      {
                        replace: true,
                      }
                    );
                    return;
                  }

                  /*
                   * Always use JPG.
                   * This prevents old
                   * extensions from
                   * accumulating.
                   */
                  const filePath =
                    `members/${user.id}.jpg`;

                  /*
                   * Upload cropped image
                   */
                  const {
                    error:
                      uploadError,
                  } =
                    await supabase.storage
                      .from(
                        "avatars"
                      )
                      .upload(
                        filePath,
                        blob,
                        {
                          upsert:
                            true,
                          contentType:
                            "image/jpeg",
                          cacheControl:
                            "3600",
                        }
                      );

                  if (
                    uploadError
                  ) {
                    console.error(
                      "PHOTO UPLOAD ERROR:",
                      uploadError
                    );

                    alert(
                      "Unable to upload picture."
                    );

                    return;
                  }

                  /*
                   * Get public URL
                   */
                  const {
                    data:
                      publicUrlData,
                  } =
                    supabase.storage
                      .from(
                        "avatars"
                      )
                      .getPublicUrl(
                        filePath
                      );

                  /*
                   * Cache-busting
                   */
                  const avatarUrl =
                    `${publicUrlData.publicUrl}?v=${Date.now()}`;

                  /*
                   * Update members table
                   */
                  const {
                    error:
                      updateError,
                  } =
                    await supabase
                      .from(
                        "members"
                      )
                      .update({
                        avatar_url:
                          avatarUrl,
                      })
                      .eq(
                        "id",
                        user.id
                      );

                  if (
                    updateError
                  ) {
                    console.error(
                      "AVATAR DATABASE ERROR:",
                      updateError
                    );

                    alert(
                      "Picture uploaded but profile could not be updated."
                    );

                    return;
                  }

                  /*
                   * Update screen
                   */
                  setMember(
                    (current) => ({
                      ...(current ||
                        {}),
                      avatar_url:
                        avatarUrl,
                    })
                  );

                  setShowCropper(
                    false
                  );

                  setSelectedImage(
                    null
                  );

                  setCropZoom(1);

                  setCropPosition({
                    x: 0,
                    y: 0,
                  });

                  alert(
                    "Profile picture updated successfully."
                  );
                } catch (error) {
                  console.error(
                    "CROP UPLOAD ERROR:",
                    error
                  );

                  alert(
                    "Something went wrong while uploading your picture."
                  );
                } finally {
                  setUploadingPhoto(
                    false
                  );
                }
              },
              "image/jpeg",
              0.9
            );
          } catch (error) {
            console.error(
              "CROP ERROR:",
              error
            );

            setUploadingPhoto(
              false
            );

            alert(
              "Unable to crop this picture."
            );
          }
        };

        image.onerror = () => {
          setUploadingPhoto(false);

          alert(
            "Unable to process this picture."
          );
        };

        image.src = selectedImage;
      } catch (error) {
        console.error(
          "CROP ERROR:",
          error
        );

        setUploadingPhoto(false);

        alert(
          "Unable to crop this picture."
        );
      }
    };

  /*
   * CLOSE CROPPER
   */
  const closeCropper = () => {
    if (uploadingPhoto) return;

    setShowCropper(false);
    setSelectedImage(null);
    setCropZoom(1);

    setCropPosition({
      x: 0,
      y: 0,
    });
  };

  /*
   * UPLOAD COVER PHOTO
   *
   * FREE — NO PASSWORD REQUIRED
   */
  const handleCoverUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select an image file."
        );

        event.target.value = "";
        return;
      }

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        alert(
          "Please choose a cover image smaller than 8MB."
        );

        event.target.value = "";
        return;
      }

      try {
        setUploadingCover(true);

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        const user = session?.user;

        if (!user) {
          navigate("/login", {
            replace: true,
          });
          return;
        }

        const fileExt =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const filePath =
          `members/${user.id}-cover.${fileExt}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from("avatars")
            .upload(
              filePath,
              file,
              {
                upsert: true,
                contentType:
                  file.type,
              }
            );

        if (uploadError) {
          console.error(
            "COVER UPLOAD ERROR:",
            uploadError
          );

          alert(
            "Unable to upload cover picture."
          );

          return;
        }

        const {
          data: publicUrlData,
        } =
          supabase.storage
            .from("avatars")
            .getPublicUrl(
              filePath
            );

        const coverUrl =
          publicUrlData.publicUrl;

        const {
          error: updateError,
        } =
          await supabase
            .from("members")
            .update({
              cover_url:
                coverUrl,
            })
            .eq("id", user.id);

        if (updateError) {
          console.error(
            "COVER DATABASE ERROR:",
            updateError
          );

          alert(
            "Cover uploaded but profile could not be updated."
          );

          return;
        }

        setMember(
          (current) => ({
            ...(current || {}),
            cover_url:
              coverUrl,
          })
        );

        alert(
          "Cover picture updated successfully."
        );
      } catch (error) {
        console.error(
          "COVER PHOTO ERROR:",
          error
        );

        alert(
          "Something went wrong while uploading your cover."
        );
      } finally {
        setUploadingCover(false);
        event.target.value = "";
      }
    };

  /*
   * SAVE PROFILE
   *
   * Regime is intentionally NOT
   * updated here.
   */
  const handleSaveProfile =
    async () => {
      if (!fullName.trim()) {
        alert(
          "Please enter your full name."
        );
        return;
      }

      if (!phone.trim()) {
        alert(
          "Please enter your phone number."
        );
        return;
      }

      if (!email.trim()) {
        alert(
          "Please enter your email address."
        );
        return;
      }

      try {
        setSaving(true);

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        const user = session?.user;

        if (!user) {
          navigate("/login", {
            replace: true,
          });
          return;
        }

        /*
         * UPDATE NAME + PHONE
         */
        const {
          data,
          error,
        } =
          await supabase
            .from("members")
            .update({
              full_name:
                fullName.trim(),
              phone:
                phone.trim(),
            })
            .eq("id", user.id)
            .select("*")
            .single();

        if (error) {
          console.error(
            "PROFILE SAVE ERROR:",
            error
          );

          alert(
            "Unable to save profile. Please try again."
          );

          return;
        }

        /*
         * EMAIL CHANGE
         */
        const currentEmail =
          user.email || "";

        const newEmail =
          email.trim();

        if (
          newEmail.toLowerCase() !==
          currentEmail.toLowerCase()
        ) {
          const {
            error: emailError,
          } =
            await supabase.auth.updateUser(
              {
                email: newEmail,
              }
            );

          if (emailError) {
            console.error(
              "EMAIL CHANGE ERROR:",
              emailError
            );

            setMember(data);

            alert(
              "Your name and phone were updated, but the email could not be changed. Please try again."
            );

            return;
          }

          alert(
            "Your profile was updated. Please check your email and complete the Supabase confirmation to finish changing your email."
          );
        } else {
          alert(
            "Profile updated successfully."
          );
        }

        setMember(data);
        setEditing(false);
      } catch (error) {
        console.error(
          "SAVE PROFILE ERROR:",
          error
        );

        alert(
          "Something went wrong while saving."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * LOGOUT
   */
  const handleLogout = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to log out?"
      );

    if (!confirmed) return;

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        "Unable to log out. Please try again."
      );
      return;
    }

    navigate("/", {
      replace: true,
    });
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div
        style={{
          ...styles.loading,
          background: darkMode
            ? "#07150f"
            : "#f4f8f3",
        }}
      >
        <img
          src={APP_LOGO}
          alt="CHSDOSA"
          style={styles.loadingLogo}
        />

        <p
          style={{
            color: darkMode
              ? "#f4c84d"
              : "#176b3a",
          }}
        >
          Loading Profile...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.page,
        background: darkMode
          ? "linear-gradient(180deg, #06120d 0%, #0c1d15 100%)"
          : "linear-gradient(180deg, #f4f8f3 0%, #eef4ed 100%)",
        color: darkMode
          ? "#ffffff"
          : "#173522",
      }}
    >
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <button
            style={{
              ...styles.backButton,
              background: darkMode
                ? "#10251a"
                : "#ffffff",
              color: darkMode
                ? "#ffffff"
                : "#173522",
            }}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ←
          </button>

          <div style={styles.headerTitle}>
            <strong>
              My Profile
            </strong>

            <span>
              CHSDOSA Cooperative
            </span>
          </div>

          <button
            style={{
              ...styles.themeButton,
              background: darkMode
                ? "#14291f"
                : "#ffffff",
            }}
            onClick={() =>
              setDarkMode(
                (current) =>
                  !current
              )
            }
          >
            {darkMode
              ? "☀️"
              : "🌙"}
          </button>
        </div>

        {/* PROFILE CARD */}
        <div
          style={{
            ...styles.profileCard,
            background: darkMode
              ? "#10251a"
              : "#ffffff",
            borderColor: darkMode
              ? "#234432"
              : "#e0e9e1",
          }}
        >
          {/* COVER */}
          <label
            style={{
              ...styles.cover,
              background:
                member?.cover_url
                  ? `url(${member.cover_url}) center/cover`
                  : darkMode
                  ? "linear-gradient(135deg, #0d4d2c, #176b3a, #d6ad3a)"
                  : "linear-gradient(135deg, #176b3a, #2d8a55, #d6ad3a)",
            }}
          >
            {!member?.cover_url && (
              <div
                style={
                  styles.coverOverlay
                }
              >
                <img
                  src={APP_LOGO}
                  alt="CHSDOSA"
                  style={
                    styles.coverLogo
                  }
                />

                <strong>
                  CHSDOSA
                </strong>

                <span>
                  Cooperative Society
                </span>
              </div>
            )}

            <div
              style={
                styles.coverChange
              }
            >
              {uploadingCover
                ? "Uploading..."
                : "📷 Change Cover"}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={
                handleCoverUpload
              }
              disabled={
                uploadingCover
              }
              style={
                styles.coverInput
              }
            />
          </label>

          {/* AVATAR */}
          <div
            style={{
              ...styles.avatar,
              background: darkMode
                ? "#d6ad3a"
                : "#176b3a",
            }}
            onClick={() => {
              if (
                member?.avatar_url
              ) {
                setShowPhotoViewer(
                  true
                );
              }
            }}
            title={
              member?.avatar_url
                ? "View profile picture"
                : "No profile picture yet"
            }
          >
            {member?.avatar_url ? (
              <img
                src={
                  member.avatar_url
                }
                alt="Profile"
                style={
                  styles.avatarImage
                }
              />
            ) : (
              member?.full_name
                ?.charAt(0)
                .toUpperCase() ||
              "M"
            )}
          </div>

          <h2
            style={{
              ...styles.name,
              color: darkMode
                ? "#ffffff"
                : "#123b25",
            }}
          >
            {member?.full_name ||
              "Member"}
          </h2>

          <p
            style={{
              ...styles.memberId,
              color: darkMode
                ? "#f4c84d"
                : "#176b3a",
            }}
          >
            {member?.member_number ||
              "Member ID"}
          </p>

          {/* UPLOAD PICTURE BUTTON */}
          <label
            style={
              styles.uploadPhotoButton
            }
          >
            📷{" "}
            {uploadingPhoto
              ? "Uploading..."
              : "Upload Picture"}

            <input
              type="file"
              accept="image/*"
              onChange={
                handleProfileUpload
              }
              disabled={
                uploadingPhoto
              }
              style={
                styles.hiddenInput
              }
            />
          </label>

          <p
            style={{
              ...styles.photoHint,
              color: darkMode
                ? "#aebdb4"
                : "#718078",
            }}
          >
            {uploadingPhoto
              ? "Uploading profile picture..."
              : member?.avatar_url
              ? "Tap photo to view • Use Upload Picture to change"
              : "Upload a profile picture"}
          </p>
        </div>

        {/* PERSONAL INFORMATION */}
        <div
          style={styles.sectionTitle}
        >
          Personal Information
        </div>

        <div
          style={{
            ...styles.infoCard,
            background: darkMode
              ? "#10251a"
              : "#ffffff",
            borderColor: darkMode
              ? "#234432"
              : "#e0e9e1",
          }}
        >
          <InfoRow
            icon="👤"
            label="Full Name"
            value={
              member?.full_name ||
              "Not provided"
            }
            darkMode={darkMode}
          />

          <InfoRow
            icon="🪪"
            label="Member ID"
            value={
              member?.member_number ||
              "Not assigned"
            }
            darkMode={darkMode}
          />

          <InfoRow
            icon="📧"
            label="Email"
            value={
              member?.email ||
              "Not provided"
            }
            darkMode={darkMode}
          />

          <InfoRow
            icon="📱"
            label="Phone Number"
            value={
              member?.phone ||
              "Not provided"
            }
            darkMode={darkMode}
          />

          <InfoRow
            icon="🎓"
            label="Regime / Set"
            value={
              member?.regime ||
              "Not provided"
            }
            darkMode={darkMode}
            last
          />
        </div>

        {/* EDIT PROFILE */}
        <button
          style={styles.primaryButton}
          onClick={
            editing
              ? handleCancelEditing
              : handleStartEditing
          }
        >
          ✏️{" "}
          {editing
            ? "Cancel Editing"
            : "Edit Profile"}
        </button>

        {editing && (
          <div
            style={{
              ...styles.editCard,
              background: darkMode
                ? "#10251a"
                : "#ffffff",
            }}
          >
            <div
              style={
                styles.secureNotice
              }
            >
              🔐 Account verified

              <span>
                Your password was verified before editing.
              </span>
            </div>

            <label
              style={styles.label}
            >
              Full Name
            </label>

            <input
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              style={{
                ...styles.input,
                background: darkMode
                  ? "#07150f"
                  : "#f6f9f6",
                color: darkMode
                  ? "#ffffff"
                  : "#173522",
              }}
            />

            <label
              style={styles.label}
            >
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              style={{
                ...styles.input,
                background: darkMode
                  ? "#07150f"
                  : "#f6f9f6",
                color: darkMode
                  ? "#ffffff"
                  : "#173522",
              }}
            />

            <small
              style={{
                ...styles.emailHint,
                color: darkMode
                  ? "#aebdb4"
                  : "#718078",
              }}
            >
              Changing your email requires
              confirmation from Supabase.
            </small>

            <label
              style={styles.label}
            >
              Phone Number
            </label>

            <input
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
              style={{
                ...styles.input,
                background: darkMode
                  ? "#07150f"
                  : "#f6f9f6",
                color: darkMode
                  ? "#ffffff"
                  : "#173522",
              }}
            />

            {/* LOCKED REGIME */}
            <label
              style={styles.label}
            >
              Regime / Set
            </label>

            <div
              style={{
                ...styles.lockedInput,
                background: darkMode
                  ? "#07150f"
                  : "#f1f4f1",
                color: darkMode
                  ? "#8fa59a"
                  : "#718078",
              }}
            >
              {member?.regime ||
                "Not provided"}

              <span>
                🔒
              </span>
            </div>

            <small
              style={{
                ...styles.emailHint,
                color: darkMode
                  ? "#aebdb4"
                  : "#718078",
              }}
            >
              Regime / Set can only be
              changed by an authorized
              administrator.
            </small>

            <button
              style={
                styles.saveButton
              }
              onClick={
                handleSaveProfile
              }
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        )}

        {/* SETTINGS */}
        <div
          style={styles.sectionTitle}
        >
          Settings & Support
        </div>

        <div
          style={{
            ...styles.menuCard,
            background: darkMode
              ? "#10251a"
              : "#ffffff",
          }}
        >
          <MenuRow
            icon="👥"
            title="View Regime Members"
            subtitle="See members in your Regime / Set"
            onClick={() =>
              navigate(
                "/regime-members"
              )
            }
            darkMode={darkMode}
          />

          <MenuRow
            icon="💬"
            title="Member Chat"
            subtitle="Chat with CHSDOSA members"
            onClick={() =>
              navigate("/chat")
            }
            darkMode={darkMode}
          />

          <MenuRow
            icon="🆘"
            title="Customer Service / Help"
            subtitle="Get help with your account"
            onClick={() =>
              navigate("/help")
            }
            darkMode={darkMode}
          />

          <MenuRow
            icon="⭐"
            title="Rate Us"
            subtitle="Tell us about your experience"
            onClick={() =>
              alert(
                "Thank you for supporting CHSDOSA Cooperative Society."
              )
            }
            darkMode={darkMode}
          />

          <MenuRow
            icon={
              darkMode
                ? "☀️"
                : "🌙"
            }
            title="Appearance"
            subtitle={
              darkMode
                ? "Dark mode is on"
                : "Light mode is on"
            }
            onClick={() =>
              setDarkMode(
                (current) =>
                  !current
              )
            }
            darkMode={darkMode}
            last
          />
        </div>

        {/* LOGOUT */}
        <button
          style={styles.logout}
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

        <div style={styles.footer}>
          <img
            src={APP_LOGO}
            alt="CHSDOSA"
            style={styles.footerLogo}
          />

          <p>
            CHSDOSA Cooperative Society
          </p>

          <small>
            Leadership with Integrity,
            Unity and Progress
          </small>
        </div>
      </div>

      {/* PROFILE PHOTO VIEWER */}
      {showPhotoViewer &&
        member?.avatar_url && (
          <div
            style={
              styles.photoViewerBackdrop
            }
            onClick={() =>
              setShowPhotoViewer(false)
            }
          >
            <button
              style={
                styles.photoViewerClose
              }
              onClick={() =>
                setShowPhotoViewer(
                  false
                )
              }
            >
              ✕
            </button>

            <div
              style={
                styles.photoViewerContent
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={
                  member.avatar_url
                }
                alt={
                  member.full_name ||
                  "Profile"
                }
                style={
                  styles.photoViewerImage
                }
              />

              <div
                style={
                  styles.photoViewerName
                }
              >
                {member.full_name ||
                  "CHSDOSA Member"}
              </div>

              <div
                style={
                  styles.photoViewerId
                }
              >
                {member.member_number ||
                  "CHSDOSA MEMBER"}
              </div>
            </div>
          </div>
        )}

      {/* PHOTO CROPPER */}
      {showCropper &&
        selectedImage && (
          <div
            style={
              styles.cropperBackdrop
            }
          >
            <div
              style={{
                ...styles.cropperModal,
                background: darkMode
                  ? "#10251a"
                  : "#ffffff",
              }}
            >
              <div
                style={
                  styles.cropperHeader
                }
              >
                <strong
                  style={{
                    color: darkMode
                      ? "#ffffff"
                      : "#173522",
                  }}
                >
                  Crop Profile Picture
                </strong>

                <button
                  style={
                    styles.cropperClose
                  }
                  onClick={
                    closeCropper
                  }
                  disabled={
                    uploadingPhoto
                  }
                >
                  ✕
                </button>
              </div>

              <p
                style={{
                  ...styles.cropperHint,
                  color: darkMode
                    ? "#aebdb4"
                    : "#718078",
                }}
              >
                Move the picture and
                zoom it until you are
                happy with the crop.
              </p>

              {/* CROP AREA */}
              <div
                style={
                  styles.cropArea
                }
                onPointerDown={
                  handleCropPointerDown
                }
                onPointerMove={
                  handleCropPointerMove
                }
                onPointerUp={
                  handleCropPointerUp
                }
                onPointerCancel={
                  handleCropPointerUp
                }
              >
                <img
                  src={selectedImage}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    ...styles.cropImage,
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropZoom})`,
                  }}
                />

                <div
                  style={
                    styles.cropCircle
                  }
                />
              </div>

              {/* ZOOM */}
              <div
                style={
                  styles.zoomArea
                }
              >
                <span>🔍</span>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={(
                    event
                  ) =>
                    setCropZoom(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  style={
                    styles.zoomSlider
                  }
                  disabled={
                    uploadingPhoto
                  }
                />

                <span>🔎</span>
              </div>

              {/* BUTTONS */}
              <div
                style={
                  styles.cropButtons
                }
              >
                <button
                  style={
                    styles.cropCancelButton
                  }
                  onClick={
                    closeCropper
                  }
                  disabled={
                    uploadingPhoto
                  }
                >
                  Cancel
                </button>

                <button
                  style={
                    styles.cropUploadButton
                  }
                  onClick={
                    createCroppedImage
                  }
                  disabled={
                    uploadingPhoto
                  }
                >
                  {uploadingPhoto
                    ? "Uploading..."
                    : "✓ Crop & Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* PASSWORD VERIFICATION MODAL */}
      {showPasswordVerification && (
        <div
          style={
            styles.modalBackdrop
          }
        >
          <div
            style={{
              ...styles.passwordModal,
              background: darkMode
                ? "#10251a"
                : "#ffffff",
            }}
          >
            <div
              style={styles.lockIcon}
            >
              🔐
            </div>

            <h3
              style={{
                margin:
                  "8px 0 5px",
                color: darkMode
                  ? "#ffffff"
                  : "#173522",
              }}
            >
              Verify Your Password
            </h3>

            <p
              style={{
                ...styles.modalText,
                color: darkMode
                  ? "#aebdb4"
                  : "#718078",
              }}
            >
              Enter your current
              password before
              changing your account
              information.
            </p>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              placeholder="Current password"
              autoFocus
              style={{
                ...styles.input,
                background: darkMode
                  ? "#07150f"
                  : "#f6f9f6",
                color: darkMode
                  ? "#ffffff"
                  : "#173522",
              }}
            />

            <button
              style={
                styles.saveButton
              }
              onClick={
                verifyPasswordAndEdit
              }
              disabled={
                verifyingPassword
              }
            >
              {verifyingPassword
                ? "Verifying..."
                : "Verify & Continue"}
            </button>

            <button
              style={
                styles.cancelModalButton
              }
              onClick={() => {
                setShowPasswordVerification(
                  false
                );

                setCurrentPassword(
                  ""
                );
              }}
              disabled={
                verifyingPassword
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * INFORMATION ROW
 */
function InfoRow({
  icon,
  label,
  value,
  darkMode,
  last = false,
}) {
  return (
    <div
      style={{
        ...styles.infoRow,
        borderBottom: last
          ? "none"
          : darkMode
          ? "1px solid #234432"
          : "1px solid #edf1ed",
      }}
    >
      <div style={styles.infoIcon}>
        {icon}
      </div>

      <div style={styles.infoContent}>
        <span
          style={{
            ...styles.infoLabel,
            color: darkMode
              ? "#8fa59a"
              : "#7b877f",
          }}
        >
          {label}
        </span>

        <strong
          style={{
            ...styles.infoValue,
            color: darkMode
              ? "#ffffff"
              : "#173522",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

/*
 * MENU ROW
 */
function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
  darkMode,
  last = false,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.menuRow,
        borderBottom: last
          ? "none"
          : darkMode
          ? "1px solid #234432"
          : "1px solid #edf1ed",
      }}
    >
      <span style={styles.menuIcon}>
        {icon}
      </span>

      <span style={styles.menuText}>
        <strong
          style={{
            color: darkMode
              ? "#ffffff"
              : "#173522",
          }}
        >
          {title}
        </strong>

        <small
          style={{
            color: darkMode
              ? "#8fa59a"
              : "#7b877f",
          }}
        >
          {subtitle}
        </small>
      </span>

      <span
        style={{
          ...styles.arrow,
          color: darkMode
            ? "#f4c84d"
            : "#176b3a",
        }}
      >
        ›
      </span>
    </button>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "15px 12px 40px",
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  container: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  backButton: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "12px",
    fontSize: "23px",
    cursor: "pointer",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.08)",
  },

  headerTitle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },

  themeButton: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    fontSize: "17px",
    cursor: "pointer",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.08)",
  },

  profileCard: {
    border: "1px solid",
    borderRadius: "20px",
    padding: "0 15px 22px",
    textAlign: "center",
    boxShadow:
      "0 7px 22px rgba(0,0,0,0.06)",
    marginBottom: "18px",
    overflow: "hidden",
  },

  cover: {
    height: "145px",
    margin: "0 -15px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: "pointer",
  },

  coverOverlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#ffffff",
    textShadow:
      "0 2px 6px rgba(0,0,0,0.35)",
  },

  coverLogo: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
    marginBottom: "5px",
  },

  coverChange: {
    position: "absolute",
    right: "10px",
    bottom: "9px",
    padding: "6px 9px",
    borderRadius: "20px",
    background:
      "rgba(0,0,0,0.45)",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: "800",
    backdropFilter: "blur(4px)",
  },

  coverInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },

  avatar: {
    width: "88px",
    height: "88px",
    margin: "-44px auto 0",
    borderRadius: "50%",
    border: "4px solid #d6ad3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: "900",
    position: "relative",
    cursor: "pointer",
    zIndex: 3,
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.18)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  hiddenInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },

  uploadPhotoButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "10px",
    padding: "9px 15px",
    borderRadius: "20px",
    background: "#176b3a",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "900",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },

  name: {
    margin: "12px 0 3px",
    fontSize: "21px",
  },

  memberId: {
    margin: 0,
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.8px",
  },

  photoHint: {
    margin: "7px 0 0",
    fontSize: "10px",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: "900",
    margin:
      "18px 2px 8px",
  },

  infoCard: {
    border: "1px solid",
    borderRadius: "16px",
    padding: "4px 13px",
    boxShadow:
      "0 5px 17px rgba(0,0,0,0.04)",
  },

  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 2px",
  },

  infoIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "#eef5ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  infoContent: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
  },

  infoLabel: {
    fontSize: "9px",
  },

  infoValue: {
    fontSize: "12px",
    wordBreak: "break-word",
  },

  primaryButton: {
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    border: "none",
    borderRadius: "11px",
    background: "#176b3a",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  editCard: {
    marginTop: "10px",
    padding: "15px",
    borderRadius: "15px",
    boxShadow:
      "0 5px 18px rgba(0,0,0,0.06)",
  },

  secureNotice: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "10px",
    background: "#eef5ef",
    color: "#176b3a",
    fontSize: "11px",
    fontWeight: "900",
  },

  label: {
    display: "block",
    fontSize: "10px",
    fontWeight: "800",
    margin:
      "8px 0 5px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border:
      "1px solid #dce5dd",
    borderRadius: "10px",
    outline: "none",
    fontSize: "12px",
  },

  lockedInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border:
      "1px solid #dce5dd",
    borderRadius: "10px",
    fontSize: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  emailHint: {
    display: "block",
    marginTop: "5px",
    fontSize: "9px",
    lineHeight: 1.4,
  },

  saveButton: {
    width: "100%",
    marginTop: "13px",
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background: "#d6ad3a",
    color: "#173522",
    fontWeight: "900",
    cursor: "pointer",
  },

  menuCard: {
    borderRadius: "16px",
    padding: "3px 13px",
    boxShadow:
      "0 5px 17px rgba(0,0,0,0.05)",
  },

  menuRow: {
    width: "100%",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px 2px",
    textAlign: "left",
    cursor: "pointer",
  },

  menuIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#eef5ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },

  menuText: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    flex: 1,
  },

  arrow: {
    fontSize: "25px",
    fontWeight: "300",
  },

  logout: {
    width: "100%",
    marginTop: "18px",
    padding: "12px",
    border:
      "1px solid #e3d8d8",
    borderRadius: "11px",
    background: "transparent",
    color: "#a13a3a",
    fontWeight: "800",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    marginTop: "22px",
    color: "#8a958d",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  footerLogo: {
    width: "40px",
    height: "40px",
    objectFit: "contain",
    borderRadius: "10px",
    marginBottom: "5px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogo: {
    width: "65px",
    height: "65px",
    objectFit: "contain",
    marginBottom: "10px",
  },

  /*
   * PHOTO VIEWER
   */
  photoViewerBackdrop: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.94)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  photoViewerClose: {
    position: "absolute",
    top: "18px",
    right: "18px",
    width: "42px",
    height: "42px",
    border: "none",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.14)",
    color: "#ffffff",
    fontSize: "22px",
    cursor: "pointer",
    zIndex: 2,
  },

  photoViewerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "92vw",
  },

  photoViewerImage: {
    width: "min(82vw, 430px)",
    height: "min(82vw, 430px)",
    objectFit: "cover",
    borderRadius: "50%",
    border:
      "5px solid #d6ad3a",
    boxShadow:
      "0 20px 70px rgba(0,0,0,0.55)",
  },

  photoViewerName: {
    marginTop: "16px",
    fontSize: "18px",
    fontWeight: "900",
    textAlign: "center",
  },

  photoViewerId: {
    marginTop: "5px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.7px",
  },

  /*
   * CROPPER
   */
  cropperBackdrop: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.72)",
    zIndex: 10001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    boxSizing: "border-box",
  },

  cropperModal: {
    width: "100%",
    maxWidth: "430px",
    borderRadius: "22px",
    padding: "17px",
    boxSizing: "border-box",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.35)",
  },

  cropperHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "16px",
  },

  cropperClose: {
    width: "35px",
    height: "35px",
    border: "none",
    borderRadius: "50%",
    background: "#eef5ef",
    color: "#173522",
    fontSize: "17px",
    cursor: "pointer",
  },

  cropperHint: {
    fontSize: "10px",
    lineHeight: 1.5,
    margin:
      "8px 0 12px",
  },

  cropArea: {
    width: "100%",
    height: "330px",
    position: "relative",
    overflow: "hidden",
    background: "#050505",
    borderRadius: "16px",
    touchAction: "none",
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  cropImage: {
    position: "absolute",
    maxWidth: "none",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
    transformOrigin:
      "center center",
  },

  cropCircle: {
    position: "absolute",
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    border:
      "3px solid #ffffff",
    boxShadow:
      "0 0 0 9999px rgba(0,0,0,0.48)",
    pointerEvents: "none",
  },

  zoomArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "15px",
  },

  zoomSlider: {
    flex: 1,
    cursor: "pointer",
  },

  cropButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },

  cropCancelButton: {
    flex: 1,
    padding: "11px",
    border:
      "1px solid #dce5dd",
    borderRadius: "10px",
    background: "transparent",
    color: "#718078",
    fontWeight: "800",
    cursor: "pointer",
  },

  cropUploadButton: {
    flex: 1.5,
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background: "#176b3a",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
  },

  /*
   * PASSWORD MODAL
   */
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
    boxSizing: "border-box",
  },

  passwordModal: {
    width: "100%",
    maxWidth: "390px",
    borderRadius: "20px",
    padding: "22px",
    boxSizing: "border-box",
    textAlign: "center",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.25)",
  },

  lockIcon: {
    width: "55px",
    height: "55px",
    margin: "0 auto",
    borderRadius: "50%",
    background: "#eef5ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  modalText: {
    fontSize: "11px",
    lineHeight: 1.5,
    margin:
      "0 0 15px",
  },

  cancelModalButton: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    border: "none",
    background: "transparent",
    color: "#718078",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default Profile;