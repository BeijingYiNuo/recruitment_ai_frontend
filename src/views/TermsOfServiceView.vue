<template>
  <div class="tos-page">
    <div class="tos-container">
      <div class="tos-header">
        <h1>晓聘用户服务协议</h1>
        <p class="tos-meta">
          <span>更新日期：2026年7月</span>
          <span>生效日期：2026年7月</span>
        </p>
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div class="tos-body">
        <p>欢迎您使用晓聘！晓聘是由一诺晓聘及其关联公司（以下简称"我们"或"晓聘"）开发、运营的智能面试助手系统。</p>
        <p>《晓聘用户服务协议》（以下简称"本协议"）是您（以下简称"用户"或"您"）与一诺晓聘之间就使用晓聘产品及服务所订立的协议。请您务必审慎阅读、充分理解本协议各条款内容，特别是免除或者限制责任的条款、争议解决条款，以及单独服务协议的约定。您开始使用晓聘提供的任何一项服务，即视为您已阅读并充分理解本协议，且完全同意本协议的全部内容。 如果您未满18周岁，请在法定监护人的陪同下阅读本协议。</p>
        <p>本协议与《晓聘隐私政策》<router-link to="/paid-service-agreement" class="tos-inline-link">《晓聘付费协议》</router-link>（如涉及付费服务）共同构成您与晓聘之间的完整约定。</p>

        <div class="tos-toc">
          <p>本协议将帮助您了解以下内容：</p>
          <ul>
            <li><a href="javascript:void(0)" @click="scrollTo('section1')">一、协议范围</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section2')">二、账号注册与使用</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section3')">三、用户行为规范</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section4')">四、AI功能特别条款</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section5')">五、使用规范</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section6')">六、付费服务</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section7')">七、知识产权</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section8')">八、服务的变更、中断与终止</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section9')">九、免责条款</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section10')">十、法律适用与争议解决</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section11')">十一、其他</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section12')">十二、联系我们</a></li>
          </ul>
        </div>

        <section id="section1">
          <h2>一、协议范围</h2>
          <p>1.1 本协议适用于晓聘通过网页端（包括已有或未来将新增的任何其他形式的客户端）向您提供的全部产品及服务。晓聘主要提供以下功能：简历管理、简历审核、面试管理、知识库管理、AI面试辅助（语音识别实时转写）、AI面试报告生成、在线支付及相关服务。</p>
          <p>1.2 我们的服务可能会根据用户需求不定期调整更新，请以我们网页实际展示的服务项目为准。</p>
        </section>

        <section id="section2">
          <h2>二、账号注册与使用</h2>
          <p><strong>2.1 注册资格</strong><br>您使用我们的服务时应为成年人，即年满18周岁以上并具备完全民事行为能力。</p>
          <p><strong>2.2 注册资料</strong><br>您应当向我们提供合法、真实、准确、完整的注册资料，不应提交任何违法或不良信息。相关资料如有变动，您应及时更新。如您提供的信息不真实、不准确、不完整或未及时更新，您将可能无法使用部分或全部服务，并自行承担由此产生的不利后果。晓聘有权对您提供的资料进行合理审查，对于不符合要求的，有权拒绝提供服务或终止已提供的服务。</p>
          <p><strong>2.3 账号安全</strong><br>您应妥善保管您的用户名、密码和验证码。除晓聘存在过错外，您应对您账号项下的所有行为结果负责。您不得将账号出售、转让、转借他人使用。如因您未妥善保管导致账号被盗用或泄露，您应立即通知晓聘。您理解晓聘对您的请求采取行动需要合理时间，在此之前晓聘对已执行的指令及导致的损失不承担责任。</p>
          <p><strong>2.4 账号注销</strong><br>您可通过晓聘客服申请注销账号。您的账号若处于异常状态（如限制、冻结），将无法进行注销。账号注销后，晓聘将在约定期限内删除或匿名化您的个人信息。</p>
        </section>

        <section id="section3">
          <h2>三、用户行为规范</h2>
          <p>3.1 您在使用晓聘服务过程中不得从事以下行为：</p>
          <ul>
            <li>违反宪法和法律、法规、规章规定；</li>
            <li>危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一；</li>
            <li>损害国家荣誉和利益；</li>
            <li>煽动民族仇恨、民族歧视，破坏民族团结；</li>
            <li>破坏国家宗教政策，宣扬邪教和封建迷信；</li>
            <li>散布谣言，扰乱公共秩序、社会秩序，破坏社会稳定；</li>
            <li>散布淫秽、色情、赌博、暴力、恐怖或教唆犯罪内容；</li>
            <li>侮辱、诽谤他人，侵害他人名誉权、肖像权、隐私权、知识产权、商业秘密等合法权益；</li>
            <li>发布、传送、传播广告信息、营销信息及垃圾信息；</li>
            <li>利用晓聘AI功能生成含有歧视、违法、侵犯他人合法权益的内容；</li>
            <li>其他违反法律法规、公共道德或本协议约定的行为。</li>
          </ul>
          <p>3.2 您不得自行或授权他人利用第三方软件采取绕过、破解、侵入等手段干扰、破坏系统功能或窃取、修改系统数据。您不得使用任何自动程序（如爬虫、机器人）对晓聘进行非正常访问或数据获取。</p>
          <p>3.3 若您违反本条约定，晓聘有权独立判断并采取以下梯度处置措施：第一级，系统警告通知（适用于轻微违规）；第二级，限制部分功能（适用于警告后未及时整改）；第三级，暂停账号7至30日（适用于中度违规）；第四级，永久终止账号（适用于严重违规，如泄露他人信息、利用系统从事违法活动等）。同时，晓聘有权删除、屏蔽违规内容，并向相关监管机关报告。</p>
          <p>3.4 因您违反本协议或法律法规导致晓聘遭受损失（包括但不限于赔偿金、和解款、律师费、诉讼费等），您应承担全部赔偿责任。</p>
        </section>

        <section id="section4">
          <h2>四、AI功能特别条款</h2>
          <p>4.1 晓聘提供基于人工智能技术的辅助功能，包括AI语音识别（ASR）实时转写和AI大模型面试报告生成等。AI辅助功能是辅助工具，不构成对任何面试对象的最终评价或决策。</p>
          <p>4.2 AI生成内容可能存在误差、偏见或虚构，仅供参考，必须经人工复核后使用。您不得利用AI功能生成含有歧视、违法、侵犯他人隐私或合法权益的内容。</p>
          <p>4.3 晓聘保证不会使用您上传的简历、面试录音、面试记录等业务数据用于AI模型的通用训练。为改进服务质量，我们可能使用经匿名化和去标识化处理（无法还原至特定自然人）的数据进行模型性能评估。</p>
          <p>4.4 因晓聘AI算法存在系统性歧视或重大技术缺陷直接造成您实质性损失的，晓聘需承担相应赔偿责任。因您未进行人工复核、直接依赖AI输出作出决策导致的损失，由您自行承担。</p>
        </section>

        <section id="section5">
          <h2>五、使用规范</h2>
          <p>5.1 您通过本系统处理面试相关信息时，不得收集婚育状况、生育计划、宗教信仰、籍贯（与工作地点要求无关的）、疾病史、外貌等与面试无关的歧视性信息。晓聘有权对疑似歧视性信息进行技术识别和拦截。</p>
          <p>5.2 您使用AI录音面试功能前，必须提前告知面试对象录音目的、用途、接收方和留存期限，并取得其明确的同意后方可开启录音。未取得同意擅自录音的，晓聘有权关闭您的录音功能。</p>
          <p>5.3 您独立承担使用本系统产生的合规责任，包括确保收集相关信息已获得合法授权、履行告知义务、遵守适用的个人信息保护及劳动法律法规。</p>
        </section>

        <section id="section6">
          <h2>六、付费服务</h2>
          <p>如您使用晓聘的付费服务（包括但不限于简历上传额度、AI面试服务时长或次数等），请同时遵守《晓聘付费协议》的约定。付费服务的具体内容、价格、支付方式、退款规则以购买页面展示和《晓聘付费协议》为准。</p>
        </section>

        <section id="section7">
          <h2>七、知识产权</h2>
          <p>7.1 晓聘产品及服务中包含的文本、软件、系统、图片、图形、音频、视频等均受知识产权法律保护，相关权利归晓聘所有。未经书面授权，任何人不得复制、修改、传播、镜像、反向工程或以其他方式使用。</p>
          <p>7.2 您在使用晓聘服务时上传、发布的内容（包括简历、面试评价等），知识产权归您或原始权利人所有。为向您提供本系统服务（包括AI功能），您授予晓聘非独占、有限、仅用于提供本服务的必要使用许可。</p>
          <p>7.3 为系统安全检测、软件兼容性研究等合法目的进行的反向工程，以及法律明确允许的其他情形，不受前述禁止反向工程限制。</p>
        </section>

        <section id="section8">
          <h2>八、服务的变更、中断与终止</h2>
          <p>8.1 晓聘可能根据业务需要对服务内容进行变更，也可能中断、中止或终止服务。计划内维护将通过系统公告通知用户。</p>
          <p>8.2 晓聘终止服务前，将给予合理的缓冲期供您备份数据。服务终止后的数据处理，按照《晓聘隐私政策》执行。</p>
          <p>8.3 您有责任自行备份存储在本服务中的重要数据。服务终止后，除法律法规另有规定外，晓聘没有义务为您保留或导出数据。</p>
        </section>

        <section id="section9">
          <h2>九、免责条款</h2>
          <p>9.1 您充分理解并同意，晓聘的服务是按照现有技术和条件所能达到的现状提供的。晓聘会尽最大努力向您提供服务，确保服务的连贯性和安全性；但晓聘不能随时预见和防范法律、技术以及其他风险，包括但不限于不可抗力、病毒、木马、黑客攻击、系统不稳定、第三方服务瑕疵、政府行为等原因可能导致的服务中断、数据丢失以及其他的损失和风险。当您遭遇上述风险，晓聘将不会对您的损失承担责任。</p>
          <p>9.2 晓聘依据本协议约定获得处理违法违规内容的权利，该权利不构成晓聘的义务或承诺，晓聘不能保证及时发现违法行为或进行相应处理。</p>
          <p>9.3 由于注册信息均由用户自行提供，晓聘将不会对其真实性、准确性、完整性作出任何保证。</p>
        </section>

        <section id="section10">
          <h2>十、法律适用与争议解决</h2>
          <p>10.1 本协议的成立、生效、履行、解释及争议解决均适用中华人民共和国法律。</p>
          <p>10.2 因本协议引起的或与本协议有关的任何争议，双方应友好协商解决。协商不成的，可向属地网信部门、人力资源社会保障部门申请调解；调解不成的，任何一方可将争议提交至被告所在地有管辖权的人民法院管辖。</p>
        </section>

        <section id="section11">
          <h2>十一、其他</h2>
          <p>11.1 本协议中的任何条款无论因何种原因完全或部分无效，不影响其余条款的有效性和约束力。</p>
          <p>11.2 晓聘有权根据法律法规变化和服务需要修改本协议，修改后将通过系统公告、弹窗或其他适当方式通知您。重大变更需您手动勾选同意后方可继续使用。如您不同意修改内容，您可停止使用服务并注销账号。</p>
          <p>11.3 本协议未尽事宜，按照《晓聘隐私政策》《晓聘付费协议》及晓聘发布的其他规则执行。</p>
        </section>

        <section id="section12">
          <h2>十二、联系我们</h2>
          <p>一诺晓聘</p>
          <ul>
            <li>联系电话：15997535900</li>
          </ul>
          <p>如对本协议有任何建议或疑问，请通过上述方式与我们联系。</p>
          <p><em>本协议可能存在多种语言版本，如各语言版本条款出现不一致或冲突，以中文版本为准。</em></p>
        </section>
      </div>

      <div class="tos-footer">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/register')
  }
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped lang="scss">
.tos-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.tos-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #dee0e3;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
}

.tos-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #3370ff;
  position: relative;

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1f2329;
    margin: 0 0 8px 0;
  }

  .tos-meta {
    display: flex;
    justify-content: center;
    gap: 24px;
    font-size: 14px;
    color: #8f959e;
    margin: 0;
  }

  .back-btn {
    position: absolute;
    left: 0;
    top: 0;
  }
}

.tos-toc {
  background: #fafbfc;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 32px;

  p {
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1f2329;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      font-size: 14px;
      line-height: 1.8;

      a {
        color: #3370ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.tos-body {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2329;

  > p {
    margin: 12px 0;
    text-align: justify;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2329;
    margin: 36px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e6eb;
  }

  p {
    margin: 8px 0;
    text-align: justify;
  }

  ul {
    margin: 8px 0;
    padding-left: 20px;

    li {
      margin: 6px 0;
      line-height: 1.7;
    }
  }
}

.tos-inline-link {
  color: #3370ff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.tos-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}

@media (max-width: 640px) {
  .tos-page {
    padding: 16px 8px;
  }

  .tos-container {
    padding: 24px 16px;
  }

  .tos-header {
    .tos-meta {
      flex-direction: column;
      gap: 4px;
    }

    .back-btn {
      position: static;
      display: block;
      margin-bottom: 12px;
    }
  }
}
</style>
