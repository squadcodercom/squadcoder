import { Component } from "solid-js"
import { Dialog } from "@squadcoder/ui/dialog"
import { Tabs } from "@squadcoder/ui/tabs"
import { Icon } from "@squadcoder/ui/icon"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsAgents } from "./settings-agents"
import { SettingsGeneral } from "./settings-general"
import { SettingsIndexing } from "./settings-indexing"
import { SettingsKeybinds } from "./settings-keybinds"
import { SettingsMcp } from "./settings-mcp"
import { SettingsModels } from "./settings-models"
import { SettingsPlugins } from "./settings-plugins"
import { SettingsProviders } from "./settings-providers"
import { SettingsRemote } from "./settings-remote"
import { SettingsRoutines } from "./settings-routines"
import { SettingsSkills } from "./settings-skills"
import { SettingsUsage } from "./settings-usage"

// `section` lets the top-bar status popover + command palette deep-link straight to a pane
// (e.g. openSettings("mcp")). The dialog remounts on each open, so defaultValue is enough.
export const DialogSettings: Component<{ section?: string }> = (props) => {
  const language = useLanguage()
  const platform = usePlatform()

  return (
    <Dialog size="x-large" transition>
      <Tabs
        orientation="vertical"
        variant="settings"
        defaultValue={props.section ?? "general"}
        class="h-full settings-dialog"
      >
        <Tabs.List>
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex flex-col gap-3 w-full pt-3">
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1.5">
                  <Tabs.SectionTitle>{language.t("settings.section.desktop")}</Tabs.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <Tabs.Trigger value="general">
                      <Icon name="sliders" />
                      {language.t("settings.tab.general")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="shortcuts">
                      <Icon name="keyboard" />
                      {language.t("settings.tab.shortcuts")}
                    </Tabs.Trigger>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <Tabs.SectionTitle>{language.t("settings.section.workspace")}</Tabs.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <Tabs.Trigger value="agents">
                      <Icon name="brain" />
                      {language.t("settings.agents.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="skills">
                      <Icon name="checklist" />
                      {language.t("settings.skills.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="indexing">
                      <Icon name="magnifying-glass" />
                      {language.t("settings.indexing.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="routines">
                      <Icon name="task" />
                      {language.t("settings.routines.title")}
                    </Tabs.Trigger>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <Tabs.SectionTitle>{language.t("settings.section.server")}</Tabs.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <Tabs.Trigger value="providers">
                      <Icon name="providers" />
                      {language.t("settings.providers.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="usage">
                      <Icon name="status" />
                      {language.t("settings.usage.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="models">
                      <Icon name="models" />
                      {language.t("settings.models.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="mcp">
                      <Icon name="mcp" />
                      {language.t("settings.mcp.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="plugins">
                      <Icon name="fork" />
                      {language.t("settings.plugins.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="remote">
                      <Icon name="server" />
                      {language.t("settings.remote.title")}
                    </Tabs.Trigger>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1 ps-1 py-1 text-12-medium text-text-weak">
              <span>{language.t("app.name.desktop")}</span>
              <span class="text-11-regular">v{platform.version}</span>
            </div>
          </div>
        </Tabs.List>
        <Tabs.Content value="general" class="no-scrollbar">
          <SettingsGeneral />
        </Tabs.Content>
        <Tabs.Content value="shortcuts" class="no-scrollbar">
          <SettingsKeybinds />
        </Tabs.Content>
        <Tabs.Content value="agents" class="no-scrollbar">
          <SettingsAgents />
        </Tabs.Content>
        <Tabs.Content value="skills" class="no-scrollbar">
          <SettingsSkills />
        </Tabs.Content>
        <Tabs.Content value="indexing" class="no-scrollbar">
          <SettingsIndexing />
        </Tabs.Content>
        <Tabs.Content value="routines" class="no-scrollbar">
          <SettingsRoutines />
        </Tabs.Content>
        <Tabs.Content value="providers" class="no-scrollbar">
          <SettingsProviders />
        </Tabs.Content>
        <Tabs.Content value="usage" class="no-scrollbar">
          <SettingsUsage />
        </Tabs.Content>
        <Tabs.Content value="models" class="no-scrollbar">
          <SettingsModels />
        </Tabs.Content>
        <Tabs.Content value="mcp" class="no-scrollbar">
          <SettingsMcp />
        </Tabs.Content>
        <Tabs.Content value="plugins" class="no-scrollbar">
          <SettingsPlugins />
        </Tabs.Content>
        <Tabs.Content value="remote" class="no-scrollbar">
          <SettingsRemote />
        </Tabs.Content>
      </Tabs>
    </Dialog>
  )
}
