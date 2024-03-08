import { useIsMutating } from '@tanstack/react-query'
import type { inferProcedureOutput } from '@trpc/server'
import clsx from 'clsx'
import type {
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import { i18n } from 'next-i18next.config'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import 'todomvc-app-css/index.css'
import 'todomvc-common/base.css'
import { useLocale } from '~/utils/use-locale'
import { InfoFooter } from '~/components/footer'
import type { AppRouter } from '~/server/routers/_app'
import { ssgInit } from '~/server/ssg-init'
import { trpc } from '~/utils/trpc'
import { useClickOutside } from '~/utils/use-click-outside'

type Calendar = inferProcedureOutput<AppRouter['calendar']['all']>[number];

function ListItem(props: { calendar: Calendar  }) {
  const { calendar } = props;

  const [editing, setEditing] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const [text, setText] = useState(calendar.text);

  useEffect(() => {
    setText(calendar.text);
  }, [calendar.text]);

  const editCalendar = trpc.calendar.edit.useMutation({
    async onMutate({ id, data }) {
      await utils.calendar.all.cancel();
      const allTasks = utils.calendar.all.getData();
      if (!allTasks) {
        return;
      }
      utils.calendar.all.setData(
        undefined,
        allTasks.map((t: Calendar) =>
          t.id === Number(id)
            ? {
              ...t,
              ...data,
            }
            : t,
        ),
      );
    },
  });
  const deleteCalendar = trpc.calendar.delete.useMutation({
    async onMutate() {
      await utils.calendar.all.cancel();
      const allTasks = utils.calendar.all.getData();
      if (!allTasks) {
        return;
      }
      utils.calendar.all.setData(
        undefined,
        allTasks.filter((t: Calendar) => t.id != calendar.id),
      );
    },
  });

  useClickOutside({
    ref: wrapperRef,
    enabled: editing,
    callback() {
      editCalendar.mutate({
        id: calendar.id,
        data: { text },
      });
      setEditing(false);
    },
  });

  return (
    <li
      key={calendar.id}
      className={clsx(editing && 'editing', calendar.completed && 'completed')}
      ref={wrapperRef}
    >
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={calendar.completed}
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            editCalendar.mutate({
              id: calendar.id,
              data: { completed: checked },
            });
          }}
          autoFocus={editing}
        />
        <label
          onDoubleClick={(e) => {
            setEditing(true);
            e.currentTarget.focus();
          }}
        >
          {text}
        </label>
        <button
          className="destroy"
          onClick={() => {
            deleteCalendar.mutate(calendar.id);
          }}
        />
      </div>
      <input
        className="edit"
        value={text}
        ref={inputRef}
        onChange={(e) => {
          const newText = e.currentTarget.value;
          setText(newText);
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            editCalendar.mutate({
              id: calendar.id,
              data: { text },
            });
            setEditing(false);
          }
        }}
      />
    </li>
  );
}

type PageProps = InferGetStaticPropsType<typeof getStaticProps>;
export default function CalendarPage(props: PageProps) {
  const { t } = useLocale();
  /*
   * This data will be hydrated from the `prefetch` in `getStaticProps`. This means that the page
   * will be rendered with the data from the server and there'll be no client loading state 👍
   */
  const allCalendars = trpc.calendar.all.useQuery(undefined, {
    staleTime: 3000,
  });

  const utils = trpc.useUtils();
  const addCalendar = trpc.calendar.add.useMutation({
    async onMutate({ text }) {
      /**
       * Optimistically update the data
       * with the newly added task
       */
      await utils.calendar.all.cancel();
      const calendars = allCalendars.data ?? [];
      utils.calendar.all.setData(undefined, [
        ...calendars,
        {
          id: Math.random(),
          completed: false,
          text,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    },
  });

  const clearCompleted = trpc.calendar.clearCompleted.useMutation({
    async onMutate() {
      await utils.calendar.all.cancel();
      const tasks = allCalendars.data ?? [];
      utils.calendar.all.setData(
        undefined,
        tasks.filter((t: Calendar) => !t.completed),
      );
    },
  });

  const toggleAll = trpc.calendar.toggleAll.useMutation({
    async onMutate({ completed }) {
      await utils.calendar.all.cancel();
      const tasks = allCalendars.data ?? [];
      utils.calendar.all.setData(
        undefined,
        tasks.map((t: Calendar) => ({
          ...t,
          completed,
        })),
      );
    },
  });

  const number = useIsMutating();
  useEffect(() => {
    // invalidate queries when mutations have settled
    // doing this here rather than in `onSettled()`
    // to avoid race conditions if you're clicking fast
    if (number === 0) {
      void utils.calendar.all.invalidate();
    }
  }, [number, utils])

  const tasksLeft = allCalendars.data?.filter((t: Calendar) => !t.completed).length ?? 0
  const tasksCompleted = allCalendars.data?.filter((t: Calendar) => t.completed).length ?? 0

  const filterTasks = (calendar: Calendar) => {
    if (props.filter === 'completed') {
      return calendar.completed;
    } else if (props.filter === 'active') {
      return !calendar.completed;
    } else {
      return true;
    }
  }

  const createListItem = (calendar: Calendar) => <ListItem key={calendar.id} calendar={calendar} />

  const filteredAndMappedTasks = allCalendars.data?.filter(filterTasks).map(createListItem)

  return (
    <>
      <Head>
        <title>Todos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>

          <input
            className="new-todo"
            placeholder={t('what_needs_to_be_done')}
            autoFocus
            onKeyDown={(e) => {
              const text = e.currentTarget.value.trim();
              if (e.key === 'Enter' && text) {
                addCalendar.mutate({ text });
                e.currentTarget.value = '';
              }
            }}
          />
        </header>

        <section className="main">
          <input
            id="toggle-all"
            className="toggle-all"
            type="checkbox"
            checked={tasksCompleted === allCalendars.data?.length}
            onChange={(e) => {
              toggleAll.mutate({ completed: e.currentTarget.checked });
            }}
          />
          <label htmlFor="toggle-all">{t('mark_all_as_complete')}</label>
          <ul className="todo-list">
            {filteredAndMappedTasks}
          </ul>
        </section>

        <footer className="footer">
          <span className="todo-count">
            <strong>{tasksLeft} </strong>
            {tasksLeft == 1 ? t('task_left') : t('tasks_left')}
          </span>

          <ul className="filters">
            {filters.map((filter) => (
              <li key={'filter-' + filter}>
                <Link
                  href={'/' + filter}
                  className={filter == props.filter ? 'selected' : ''}
                >
                  {t(filter)[0].toUpperCase() + t(filter).slice(1)}
                </Link>
              </li>
            ))}
          </ul>

          {tasksCompleted > 0 && (
            <button
              className="clear-completed"
              onClick={() => {
                clearCompleted.mutate();
              }}
            >
              {t('clear_completed')}
            </button>
          )}
        </footer>
      </section>

      <InfoFooter locales={props.locales} filter={props.filter} />
    </>
  );
}

const filters = ['all', 'active', 'completed'] as const;
export const getStaticPaths: () => Promise<{
  paths: ({ params: { filter: string }; locale: string } | undefined)[];
  fallback: boolean
}> = async () => {
  /**
   * Warning: This can be very heavy if you have a lot of locales
   * @link https://nextjs.org/docs/advanced-features/i18n-routing#dynamic-routes-and-getstaticprops-pages
   */
  const paths = filters.flatMap((filter) =>
    i18n.locales.map((locale) => ({ params: { filter }, locale })),
  );

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = await ssgInit(context);

  await ssg.calendar.all.prefetch();
  const trpcState = ssg.dehydrate();

  return {
    props: {
      trpcState: trpcState,
      filter: (context.params?.filter as string) ?? 'all',
      locale: context.locale ?? context.defaultLocale,
      locales: context.locales ?? ['en', 'es'],
    },
  };
};
