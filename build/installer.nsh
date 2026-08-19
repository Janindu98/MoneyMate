!macro customHeader
  ; Set the theme colors of the installer wizard (handling pre-defined macros safely)
  !ifdef MUI_BGCOLOR
    !undef MUI_BGCOLOR
  !endif
  !define MUI_BGCOLOR "070A13"

  !ifdef MUI_TEXTCOLOR
    !undef MUI_TEXTCOLOR
  !endif
  !define MUI_TEXTCOLOR "F8FAFC"
  
  ; Set colors for the installation progress page (Foreground Background)
  !ifdef MUI_INSTFILESPAGE_COLORS
    !undef MUI_INSTFILESPAGE_COLORS
  !endif
  !define MUI_INSTFILESPAGE_COLORS "F8FAFC 0F1322"
  
  ; Add an optional Desktop Shortcut checkbox on the finish page
  !ifdef MUI_FINISHPAGE_SHOWREADME
    !undef MUI_FINISHPAGE_SHOWREADME
  !endif
  !define MUI_FINISHPAGE_SHOWREADME ""

  !ifdef MUI_FINISHPAGE_SHOWREADME_TEXT
    !undef MUI_FINISHPAGE_SHOWREADME_TEXT
  !endif
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"

  !ifdef MUI_FINISHPAGE_SHOWREADME_FUNCTION
    !undef MUI_FINISHPAGE_SHOWREADME_FUNCTION
  !endif
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcutFunc
!macroend

Function CreateDesktopShortcutFunc
  CreateShortCut "$DESKTOP\MoneyMate Vault.lnk" "$INSTDIR\MoneyMate Vault.exe" "" "$INSTDIR\resources\app.asar.unpacked\images\logo_2.ico"
FunctionEnd

!macro customInit
  ; Set default installation directory to C:\Program Files\MoneyMate Vault
  ${ifNot} ${isUpdated}
    StrCpy $INSTDIR "$PROGRAMFILES64\MoneyMate Vault"
  ${endIf}
!macroend

!macro customInstall
  ; Force reference the shortcut function to prevent NSIS warning 6010 (warning treated as error)
  GetFunctionAddress $0 CreateDesktopShortcutFunc
!macroend

!macro customUnInstall
  ; Move NSIS working directory outside the installation directory
  SetOutPath "$TEMP"

  ; Remove desktop shortcuts
  Delete "$DESKTOP\MoneyMate Vault.lnk"
  Delete "$DESKTOP\MoneyMate.lnk"

  ; Remove all files and subdirectories
  RMDir /r "$INSTDIR"

  ; Remove the empty directory explicitly
  RMDir "$INSTDIR"
!macroend


