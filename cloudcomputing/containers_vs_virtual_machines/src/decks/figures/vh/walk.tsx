import { ImportantNote, Shot, Shots } from './frames'

/**
 * SLIDES 42 TO 51: the VirtualBox walkthrough. Every caption, lead and note is
 * the reference's; the captures are the TR's own (pages 17 to 26), named as the
 * reference names them, and the two red boxes are the reference's own numbers.
 * Two captures a frame, as the reference pairs them.
 */

const INSTALL = 'Installing VirtualBox'
const WIZARD = 'New Virtual Machine Wizard'
const BOOT = 'First Boot'
const WALK = 'Screenshot Walkthrough'

export function Install1({ lesson }: { lesson: string }) {
  return (
    <Shots
      id="install-1"
      kicker={INSTALL}
      title={WALK}
      lead="Screens from the VirtualBox 7.2.8 setup wizard, shown here for reference."
      lesson={lesson}
      side={<ImportantNote width={420}>This walkthrough is a demonstration only. Installing and running a VM may slow down your system, so it is not mandatory to perform these steps.</ImportantNote>}
    >
      <Shot n={1} name="vbox-01-precheck-virtualization" caption="Pre-install check: Task Manager confirms CPU Virtualization: Enabled" highlight={{ left: 32.2, top: 86.4, width: 12, height: 5.2 }} w={640} h={342} />
    </Shots>
  )
}

export function Install2({ lesson }: { lesson: string }) {
  return (
    <Shots id="install-2" kicker={INSTALL} title={WALK} lesson={lesson}>
      <Shot n={2} name="vbox-02-welcome" caption="Welcome screen: confirms version 7.2.8 (amd64)" />
      <Shot n={3} name="vbox-03-license" caption="License Agreement: accept GPL v3 terms" />
    </Shots>
  )
}

export function Install3({ lesson }: { lesson: string }) {
  return (
    <Shots id="install-3" kicker={INSTALL} title={WALK} lesson={lesson}>
      <Shot n={4} name="vbox-04-custom-setup" caption="Custom Setup: keep default features" />
      <Shot n={5} name="vbox-05-network-warning" caption="Network Disconnection warning: expected, click Yes" />
    </Shots>
  )
}

export function Install4({ lesson }: { lesson: string }) {
  return (
    <Shots id="install-4" kicker={INSTALL} title={WALK} lesson={lesson}>
      <Shot n={6} name="vbox-06-missing-dependencies" caption="Missing Dependencies: optional, safe to skip" />
      <Shot n={7} name="vbox-07-startup-options" caption="Startup options: keep defaults checked" />
    </Shots>
  )
}

export function Install5({ lesson }: { lesson: string }) {
  return (
    <Shots id="install-5" kicker={INSTALL} title={WALK} lesson={lesson}>
      <Shot n={8} name="vbox-08-install-complete" caption="Installation complete: Finish launches VirtualBox" />
      <Shot n={9} name="vbox-09-download-ubuntu-iso" caption="Download guest OS ISO: Ubuntu 26.04.1 LTS Desktop (64-bit)" />
    </Shots>
  )
}

export function Wizard1({ lesson }: { lesson: string }) {
  return (
    <Shots id="wizard-1" kicker={WIZARD} title={WALK} lesson={lesson}>
      <Shot n={1} name="vbox-10-manager-home" caption="VirtualBox Manager home: click New (Ctrl+N)" />
      <Shot n={2} name="vbox-11-name-and-iso" caption="Name the VM, select ISO, confirm guest OS type" />
    </Shots>
  )
}

export function Wizard2({ lesson }: { lesson: string }) {
  return (
    <Shots id="wizard-2" kicker={WIZARD} title={WALK} lesson={lesson}>
      <Shot n={3} name="vbox-12-unattended-install" caption="Unattended install: set username, password, hostname" />
      <Shot n={4} name="vbox-13-virtual-hardware" caption="Virtual hardware: memory, CPUs, disk size" highlight={{ left: 86, top: 26, width: 13.5, height: 34 }} />
    </Shots>
  )
}

export function Wizard3({ lesson }: { lesson: string }) {
  return (
    <Shots id="wizard-3" kicker={WIZARD} title={WALK} lesson={lesson}>
      <Shot n={5} name="vbox-14-summary" caption="Summary: Finish creates the VM" />
      <Shot n={6} name="vbox-15-vm-starting" caption="VM starting: Details pane confirms configuration" />
    </Shots>
  )
}

export function Boot1({ lesson }: { lesson: string }) {
  return (
    <Shots id="boot-1" kicker={BOOT} title="VM Creation Confirmed" lead="The created VM boots to its own Ubuntu desktop, confirming the walkthrough above worked end to end." lesson={lesson}>
      <Shot n={1} name="vbox-16-ubuntu-desktop" caption="Ubuntu desktop running inside the VM" w={640} h={330} />
    </Shots>
  )
}

export function Boot2({ lesson }: { lesson: string }) {
  return (
    <Shots id="boot-2" kicker={BOOT} title="VM Creation Confirmed" lesson={lesson}>
      <Shot n={2} name="vbox-17-resource-use" caption="Resource Use tab: live CPU load, network rate and disk I/O" />
      <Shot n={3} name="vbox-18-save-state" caption="Save State: suspends the VM to disk instead of a full shutdown" />
    </Shots>
  )
}
