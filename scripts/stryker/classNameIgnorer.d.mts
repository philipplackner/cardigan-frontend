import type { Ignorer } from '@stryker-mutator/api/ignore'
import type { ValuePlugin, PluginKind } from '@stryker-mutator/api/plugin'

export declare const classNameIgnorer: Ignorer
export declare const strykerPlugins: ValuePlugin<PluginKind.Ignore>[]
