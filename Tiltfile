# Enable Kubernetes
allow_k8s_contexts('kind')

# Local Resources
local_resource(
    'dependencies',
    cmd='pnpm fetch && pnpm install --offline',
    deps=['pnpm-lock.yaml']
)

local_resource(
    'capture-public',
    serve_cmd='pnpm nx run @repro/capture-public:watch',
    resource_deps=['dependencies'],
    allow_parallel=True
)

local_resource(
    'capture',
    serve_cmd='pnpm nx run @repro/capture:watch',
    resource_deps=['dependencies'],
    allow_parallel=True
)

local_resource(
    'dev-toolbar',
    serve_cmd='pnpm nx run @repro/dev-toolbar:watch',
    resource_deps=['dependencies'],
    allow_parallel=True
) 

# Build base images
docker_build(
    'repro-base',
    '.',
    dockerfile='infra/docker/base.dockerfile',
    ignore=['apps/*/dist', 'apps/*/build', '**/node_modules']
)

# Main API Server
docker_build(
    'api-server-dev',
    '.',
    dockerfile='infra/docker/api-server.dockerfile',
    target='dev',
    live_update=[
        sync('.', '/app'),
    ]
)

# API Server K8s Resources
k8s_yaml('infra/k8s/api-server.app.yaml')
k8s_resource('api-server', port_forwards='8080:3001')

