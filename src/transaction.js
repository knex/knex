
export default function Transaction() {
  return {
    begin: 'BEGIN',
    savepoint: 'SAVEPOINT %s',
    commit: 'COMMIT',
    releaseSavepoint: 'RELEASE SAVEPOINT %s',
    rollback: 'ROLLBACK',
    rollbackSavepoint: 'ROLLBACK TO SAVEPOINT %s'
  }
}
