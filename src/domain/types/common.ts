/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 通用类型定义（ID、分页、筛选）
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

/** 分页参数 */
export type PageParams = {
  page: number
  pageSize: number
}

/** 分页结果 */
export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** API 统一返回 */
export type ApiResult<T> = {
  success: boolean
  data?: T
  error?: string
}

/** ID 参数 */
export type IdParam = {
  id: number
}
