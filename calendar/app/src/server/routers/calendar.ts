import { z } from 'zod';
import { baseProcedure, router } from '../trpc';
import { CalendarSchema, getSvgAsDocumentDom } from "~/calendar";
import type * as d3 from "d3";

export const calendarRouter = router({
  generate: baseProcedure
    .input(CalendarSchema)
    .mutation((opts) => {
      const { input } = opts

      const svgDom: d3.Selection<HTMLElement, unknown, null, undefined> = getSvgAsDocumentDom(input)
      const svg = svgDom.html()
      return svg
    }
  ),

  postList: baseProcedure.query(() => {
    return []
  }),

  all: baseProcedure.query(({ ctx }) => {
    return ctx.calendar.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }),
  add: baseProcedure
    .input(
      z.object({
        id: z.number().optional(),
        text: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const todo = await ctx.calendar.create({
        data: input,
      });
      return todo;
    }),
  edit: baseProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          completed: z.boolean().optional(),
          text: z.string().min(1).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      const todo = await ctx.calendar.update({
        where: { id },
        data,
      });
      return todo;
    }),
  toggleAll: baseProcedure
    .input(z.object({ completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.calendar.updateMany({
        data: { completed: input.completed },
      });
    }),
  delete: baseProcedure
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.calendar.delete({ where: { id } });
      return id;
    }),
  clearCompleted: baseProcedure.mutation(async ({ ctx }) => {
    await ctx.calendar.deleteMany({ where: { completed: true } });

    return ctx.calendar.findMany();
  }),
});
