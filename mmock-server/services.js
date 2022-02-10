async function getAllProjects(appCollection) {
  const projects = await appCollection.find()
  const result = []
  await projects.forEach(project=>{
    result.push(project)
  })
  return result
}

module.exports = { getAllProjects };
