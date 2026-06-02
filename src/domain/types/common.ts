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
