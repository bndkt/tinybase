import {
  DatabasePersisterConfig,
  Persister,
  PersisterListener,
} from '../types/persisters';
import {IdObj, objValues} from '../common/obj';
import {Database} from 'sqlite3';
import {Store} from '../types/store';
import {arrayMap} from '../common/array';
import {createSqlite3Persister as createSqlite3PersisterDecl} from '../types/persisters/persister-sqlite3';
import {createSqlitePersister} from './sqlite';
import {promiseNew} from '../common/other';

export const createSqlite3Persister = ((
  store: Store,
  db: Database,
  storeTableOrConfig?: string | DatabasePersisterConfig,
): Persister =>
  createSqlitePersister(
    store,
    storeTableOrConfig,
    (sql: string, args: any[] = []): Promise<void> =>
      promiseNew((resolve) => db.run(sql, args, () => resolve())),
    (sql: string, args: any[] = []): Promise<any[][]> =>
      promiseNew((resolve) =>
        db.all(sql, args, (_, rows: IdObj<any>[]) =>
          resolve(arrayMap(rows, objValues)),
        ),
      ),
    (listener: PersisterListener): (() => void) => {
      const observer = () => listener();
      db.on('change', observer);
      return observer;
    },
    (observer: () => void): any => db.off('change', observer),
  )) as typeof createSqlite3PersisterDecl;