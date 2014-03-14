// MySQL:

// SELECT
//     [ALL | DISTINCT | DISTINCTROW ]
//       [HIGH_PRIORITY]
//       [STRAIGHT_JOIN]
//       [SQL_SMALL_RESULT] [SQL_BIG_RESULT] [SQL_BUFFER_RESULT]
//       [SQL_CACHE | SQL_NO_CACHE] [SQL_CALC_FOUND_ROWS]
//     select_expr [, select_expr ...]
//     [FROM table_references
//     [WHERE where_condition]
//     [GROUP BY {col_name | expr | position}
//       [ASC | DESC], ... [WITH ROLLUP]]
//     [HAVING where_condition]
//     [ORDER BY {col_name | expr | position}
//       [ASC | DESC], ...]
//     [LIMIT {[offset,] row_count | row_count OFFSET offset}]
//     [PROCEDURE procedure_name(argument_list)]
//     [INTO OUTFILE 'file_name' export_options
//       | INTO DUMPFILE 'file_name'
//       | INTO var_name [, var_name]]
//     [FOR UPDATE | LOCK IN SHARE MODE]]

// DELETE
// DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM tbl_name
//     [WHERE where_condition]
//     [ORDER BY ...]
//     [LIMIT row_count]

// UPDATE
// UPDATE [LOW_PRIORITY] [IGNORE] table_reference
//     SET col_name1={expr1|DEFAULT} [, col_name2={expr2|DEFAULT}] ...
//     [WHERE where_condition]
//     [ORDER BY ...]
//     [LIMIT row_count]

