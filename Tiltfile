update_settings(
    k8s_upsert_timeout_secs=60
)

allow_k8s_contexts('kind')

load('ext://helm_resource', 'helm_resource', 'helm_repo')

local_resource(
    'dependencies',
    cmd='pnpm fetch && pnpm install --offline',
    deps=['pnpm-lock.yaml'],
    labels=['infra']
)

local_resource(
    'capture-public',
    serve_cmd='pnpm nx run @repro/capture-public:watch',
    resource_deps=['dependencies'],
    allow_parallel=True,
    labels=['extension']
)

local_resource(
    'capture',
    serve_cmd='pnpm nx run @repro/capture:watch',
    resource_deps=['dependencies'],
    allow_parallel=True,
    labels=['extension']
)

local_resource(
    'dev-toolbar',
    serve_cmd='pnpm nx run @repro/dev-toolbar:watch',
    resource_deps=['dependencies'],
    allow_parallel=True,
    labels=['extension']
)

helm_repo(
    'bitnami',
    'https://charts.bitnami.com/bitnami',
    labels=['infra']
)

helm_resource(
    name='database',
    chart='bitnami/postgresql',
    namespace='default',
    resource_deps=['bitnami'],
    flags=[
        '--set=global.postgresql.auth.username=repro',
        '--set=global.postgresql.auth.password=repro',
        '--set=global.postgresql.auth.database=repro'
    ],
    labels=['infra']
)

helm_repo(
    'seaweedfs',
    'https://seaweedfs.github.io/seaweedfs/helm',
    labels=['infra']
)

helm_resource(
    name='storage',
    chart='seaweedfs/seaweedfs',
    namespace='default',
    resource_deps=['seaweedfs'],
    flags=['--set=filer.s3.enabled=true,filer.s3.port=8080'],
    labels=['infra']
)

docker_build(
    'repro-base',
    '.',
    dockerfile='infra/docker/base.dockerfile',
    ignore=['apps/*/dist', 'apps/*/build', '**/node_modules']
)

docker_build(
    'public-api-server-dev',
    '.',
    dockerfile='infra/docker/public-api-server.dockerfile',
    target='dev',
    live_update=[
        fall_back_on([
            'pnpm-lock.yaml',
            'apps/api-server/.env-public.development',
            'apps/api-server/package.json'
        ]),
        sync('.', '/app')
    ]
)

k8s_yaml(helm(
    './infra/helm/public-api-server',
    name='public-api-server',
    set=[
        'container.image=public-api-server-dev',
        'vars.PORT=8080'
    ]
))

k8s_resource(
    'public-api-server-deployment',
    labels=['api']
)

# docker_build(
#     'api-server',
#     '.',
#     dockerfile='infra/docker/api-server.dockerfile',
#     target='dev',
#     live_update=[
#         fall_back_on([
#             'pnpm-lock.yaml',
#             'apps/api-server/.env.development',
#             'apps/api-server/package.json'
#         ]),
#         sync('.', '/app')
#     ]
# )
#
# k8s_yaml('infra/k8s/api-server.app.yaml')
#
# k8s_resource(
#     'api-server',
#     labels=['api']
# )

docker_build(
    'public-playback-ui-dev',
    '.',
    dockerfile='infra/docker/public-playback-ui.dockerfile',
    target='dev',
    live_update=[
        fall_back_on([
            'pnpm-lock.yaml',
            'apps/public-playback-ui/.env.development',
            'apps/public-playback-ui/package.json'
        ]),
        sync('.', '/app')
    ]
)

k8s_yaml(helm(
    './infra/helm/public-playback-ui',
    name='public-playback-ui',
    set=[
        'container.image=public-playback-ui-dev',
        'vars.REPRO_APP_URL=https://app.repro.localhost:8443/s',
        'vars.REPRO_API_URL=https://api.repro.localhost:8443/s',
        'vars.PORT=8443'
    ]
))

k8s_resource(
    'public-playback-ui-deployment',
    labels=['app']
)

docker_build(
    'workspace-dev',
    '.',
    dockerfile='infra/docker/workspace.dockerfile',
    target='dev',
    live_update=[
        fall_back_on([
            'pnpm-lock.yaml',
            'apps/workspace/.env.development',
            'apps/workspace/package.json',
            'apps/workspace/webpack.config.js'
        ]),
        sync('.', '/app')
    ]
)

k8s_yaml(helm(
    './infra/helm/workspace',
    name='workspace',
    set=[
        'container.image=workspace-dev',
        'vars.REPRO_APP_URL=https://app.repro.localhost:8443/w',
        'vars.REPRO_API_URL=https://api.repro.localhost:8443/w',
        'vars.PORT=8443'
    ]
))

k8s_resource(
    'workspace-deployment',
    labels=['app']
)

helm_repo(
    'ingress-nginx',
    'https://kubernetes.github.io/ingress-nginx',
    labels=['infra']
)

helm_resource(
    name='ingress-controller',
    chart='ingress-nginx/ingress-nginx',
    namespace='default',
    resource_deps=['ingress-nginx'],
    port_forwards=[
        '8080:80',
        '8443:443'
    ],
    labels=['infra']
)

k8s_yaml(helm(
    './infra/helm/gateway',
    name='gateway',
))
