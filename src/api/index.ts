/**
 * API 统一管理入口
 * 自动导入并导出所有 API 模块
 * @module api/index
 */

import { autoImportModulesSync } from '@/utils'

// 自动导入所有 API 模块
const apiModules = import.meta.glob('./modules/**/*.ts', { eager: true })
const importedAPIs = autoImportModulesSync(apiModules)

// 导出所有 API 模块

// 导出所有 API
export default importedAPIs

// 类型定义
export type APIModules = typeof importedAPIs
