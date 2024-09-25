import { getServerSession } from "next-auth";
import { Suspense } from "react";
import { Project } from "@prisma/client";

import { findProjectBySlug } from "@/helpers/projects/findProjectBySlug";
import { BoardsList } from "@/components/boards/list";
import { authOptions } from "@/lib/auth";
import { CreateBoard } from "@/components/boards/create";
import { ProjectOptions } from "@/components/projects/options";
import Spinner from "@/components/common/spinner";
import { checkUserAccess } from "@/helpers/common/hasAccess";
import { BoardView } from "@/components/boards/view";
import { Recent } from "@/components/common/recent";
import { Input } from "@/components/ui/input";
import { Roadmap } from "@/components/common/roadmap";
import { BoardFilter } from "@/components/boards/filter";

import NotFound from "./not-found";
import PrivateBoard from "./private";

// meta data
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const project = (await findProjectBySlug(params.slug)) as Project | null;

  return {
    title: project?.name,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = (await findProjectBySlug(params.slug)) as Project | null;
  const session = await getServerSession(authOptions);

  if (!project) {
    return <NotFound />;
  }

  const hasAccess = await checkUserAccess({
    userId: session?.user.id,
    projectId: project?.id,
  });

  if (project.isPrivate && !hasAccess) {
    return <PrivateBoard type="project" />;
  }

  return (
    <div className="mx-auto h-auto max-w-7xl overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div>
        <header className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          {session && hasAccess && (
            <>
              <Input
                disabled
                className="w-full sm:w-auto"
                placeholder="Search boards... (Coming Soon)"
              />
              <section className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                <Suspense fallback={<Spinner />}>
                  <BoardFilter />
                  <ProjectOptions />
                  {session.user.isInstanceAdmin && (
                    <CreateBoard projectId={project.id} />
                  )}
                </Suspense>
              </section>
            </>
          )}
        </header>
        <main>
          <section className="flex flex-col justify-around lg:flex-row lg:space-x-8">
            {session && hasAccess && (
              <div className="mb-8 w-full lg:sticky lg:top-20 lg:mb-0 lg:w-[60%]">
                <span className="text-md mb-4 block">Recent Activity</span>
                <Recent projectId={project.id} />
              </div>
            )}
            <div className="w-full">
              <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                <div>
                  <span className="text-md mb-2 block sm:mb-0">Boards</span>
                </div>
                {hasAccess && <BoardView />}
              </div>
              <div className="mt-4">
                <BoardsList
                  projectId={project.id}
                  projectSlug={project.slug}
                  showAll={hasAccess ? true : false}
                  view={hasAccess ? "grid" : "list"}
                />
              </div>
              {!hasAccess && (
                <div className="mt-8">
                  <span className="mb-4 block text-sm">Roadmap</span>
                  <div className="mt-4">
                    <Suspense fallback={<Spinner />}>
                      <Roadmap projectId={project.id} />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
