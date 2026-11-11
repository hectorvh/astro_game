'use client'

import { AudioPrefsProvider } from '@/lib/jerboa/audio-prefs'
import { SessionProvider, useSession } from '@/lib/jerboa/session-context'
import { PanelStage } from './scene'
import { StartScreen } from './start-screen'
import { SplashScreen } from './splash-screen'
import { WelcomeScreen } from './welcome-screen'
import { SignInScreen } from './signin-screen'
import { LogInScreen } from './login-screen'
import { DetailsScreen } from './details-screen'
import { InformationScreen } from './information-screen'
import { ConsentScreen } from './consent-screen'
import { DeclinedScreen } from './declined-screen'
import { MenuScreen } from './menu-screen'
import { MinigameOneScreen } from './minigame-one-screen'
import { CutsceneScreen } from './cutscene-screen'
import { Bird3dScreen, Bunny3dScreen, Jerboa3dScreen } from './jerboa-3d-screen'

function CurrentScreen() {
  const { step, participant, credentials, goTo } = useSession()

  switch (step) {
    case 'start':
      return <StartScreen />
    case 'splash-scala':
      return <SplashScreen key="scala" variant="scala" />
    case 'splash-funders':
      return <SplashScreen key="funders" variant="funders" />
    case 'welcome':
      return (
        <PanelStage>
          <WelcomeScreen />
        </PanelStage>
      )
    case 'signin':
      return (
        <PanelStage>
          <SignInScreen key={credentials?.userid ?? 'new'} />
        </PanelStage>
      )
    case 'login':
      return (
        <PanelStage>
          <LogInScreen />
        </PanelStage>
      )
    case 'userdatasetup':
      return (
        <PanelStage>
          <DetailsScreen mode="signup" key={credentials?.userid ?? 'signup'} />
        </PanelStage>
      )
    case 'settings':
      return (
        <PanelStage>
          <DetailsScreen mode="settings" key={participant?.id ?? 'settings'} />
        </PanelStage>
      )
    case 'information':
      return (
        <PanelStage>
          <InformationScreen />
        </PanelStage>
      )
    case 'consent':
      return (
        <PanelStage>
          <ConsentScreen />
        </PanelStage>
      )
    case 'declined':
      return (
        <PanelStage>
          <DeclinedScreen />
        </PanelStage>
      )
    case 'menu':
      return <MenuScreen />
    case 'minigame1':
      return <MinigameOneScreen />
    case 'outro':
      return (
        <CutsceneScreen
          src="/videos/astro_bunny.mp4"
          label="Astro Bunny mission debrief"
          onDone={() => goTo('menu')}
        />
      )
    case 'jerboa3d':
      return <Jerboa3dScreen />
    case 'bunny3d':
      return <Bunny3dScreen />
    case 'bird3d':
      return <Bird3dScreen />
    default:
      return null
  }
}

export function JourneyApp() {
  return (
    <SessionProvider>
      <AudioPrefsProvider>
        <CurrentScreen />
      </AudioPrefsProvider>
    </SessionProvider>
  )
}
